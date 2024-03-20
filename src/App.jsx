import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";

export default function App() {
  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [groupedLinks, setGroupedLinks] = useState({});

  useEffect(() => {
    readExcel();
  }, []);

  function excelSerialToDate(serial) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const epoch = new Date(1900, 0, 1);
    const daysSinceEpoch = serial - 1;
    const offset = daysSinceEpoch * millisecondsPerDay;
    return new Date(epoch.getTime() + offset);
  }

  const readExcel = () => {
    const url = "/pa-promo-comparison-spreadsheet.xlsx";
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const wb = XLSX.read(ab, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const rowsToProcess = data.slice(1);

        const linkPromises = rowsToProcess.map((link) => {
          return fetch(link[1])
            .then((res) => res.text())
            .then((html) => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, "text/html");

              const base = doc.createElement("base");
              base.href = link[1];
              doc.head.appendChild(base);
              doc.querySelectorAll("img").forEach((img) => {
                const src = new URL(img.getAttribute("src"), link[1]).href;
                img.setAttribute("src", src);
                img.setAttribute("crossorigin", "anonymous");
              });

              return {
                date: excelSerialToDate(link[0]),
                link: link[1],
                html: DOMPurify.sanitize(html),
              };
            })
            .catch((error) => {
              console.error("Error fetching HTML for link:", link[1], error);
              return { date: excelSerialToDate(link[0]), link: link[1], html: "" };
            });
        });

        Promise.all(linkPromises)
          .then((formattedLinks) => {
            setLinks(formattedLinks);
            const grouped = formattedLinks.reduce((acc, link) => {
              const dateKey = link.date.toDateString();
              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(link);
              return acc;
            }, {});
            setGroupedLinks(grouped);
          })
          .catch((error) => {
            console.error("Error fetching HTML content:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    console.log(groupedLinks)
  };

  const addLink = async () => {
    const date = new Date();
    // const date = excelSerialToDate(rawDate);
    const response = await fetch("https://cors-anywhere.herokuapp.com/" + linkInput);
    console.log(response)
    const html = await response.text();
    const newLink = { date: date, link: linkInput, html: html };
    const newData = [...links, newLink];
    const ws = XLSX.utils.aoa_to_sheet(newData.map((link) => [link.date, link.link]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "pa-promo-comparison-spreadsheet.xlsx");
    setLinkInput("");
    setLinks(newData);
    setGroupedLinks(groupLinksByDate(newData));
    console.log(hello)
  };

  const groupLinksByDate = (links) => {
    return links.reduce((acc, link) => {
      const dateKey = link.date.toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(link);
      return acc;
    }, {});
  };

  return (
    <main>
      <h1>Competitor Promos</h1>
      <div className="add-promo">
        <input
          type="text"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
        />
        <button onClick={addLink}>Add Promo</button>
      </div>
      {Object.keys(groupedLinks).map((date, index) => (
        <div key={index} className="promo-group">
          <h2>{date}</h2>
          <div className="promo-row">
            {groupedLinks[date].map((link, linkIndex) => (
              <div key={linkIndex} className="promo-item">
                <div dangerouslySetInnerHTML={{ __html: link.html }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

