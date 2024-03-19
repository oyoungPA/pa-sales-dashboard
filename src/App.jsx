import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";

export default function App() {
  const [links, setLinks] = useState([]);
  // const [linkInput, setLinkInput] = useState("");

  useEffect(() => {
    readExcel();
  }, []);

  const readExcel = () => {
    const url = "/pa-promo-comparison-spreadsheet.xlsx";
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const wb = XLSX.read(ab, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const linkPromises = data.map((link) => {
          return fetch(link[1])
            .then((res) => res.text())
            .then((html) => {
              // Create a DOMParser to parse the HTML string
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, "text/html");

              // Modify the base URL for relative URLs to work correctly
              const base = doc.createElement("base");
              base.href = link[1];
              doc.head.appendChild(base);

              // Update image src attributes with absolute URLs
              doc.querySelectorAll("img").forEach((img) => {
                const src = new URL(img.getAttribute("src"), link[1]).href;
                img.setAttribute("src", src);
                img.setAttribute("crossorigin", "anonymous");
              });

              return {
                date: link[0],
                url: link[1],
                html: DOMPurify.sanitize(doc.documentElement.outerHTML),
              };
            })
            .catch((error) => {
              console.error("Error fetching HTML for link:", link[1], error);
              return { date: link[0], url: link[1], html: "" };
            });
          // fetchHtmlContent(formattedLinks);
        });

        Promise.all(linkPromises)
          .then((formattedLinks) => {
            setLinks(formattedLinks);
          })
          .catch((error) => {
            console.error("Error fetching HTML content:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  // const fetchHtmlContent = async (formattedLinks) => {
  //   const updatedLinks = await Promise.all(
  //     formattedLinks.map(async (link) => {
  //       const response = await fetch(link.url);
  //       const html = await response.text();
  //       return { ...link, html: html };
  //     }),
  //   );
  //   setLinks(updatedLinks);
  // };

  // const addLink = async () => {
  //   const date = new Date().toLocaleDateString();
  //   const response = await fetch(linkInput);
  //   const html = await response.text();
  //   const newLink = { date: date, url: linkInput, html: html };
  //   const newData = [...links, newLink];
  //   const ws = XLSX.utils.aoa_to_sheet(
  //     newData.map((link) => [link.date, link.url]),
  //   );
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  //   XLSX.writeFile(wb, "emails.xlsx");
  //   setLinkInput("");
  //   setLinks(newData);
  // };

  return (
    <main>
      <h1>Competitor Promos</h1>
      {/* <div>
        <input
          type="text"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
        />
        <button onClick={addLink}>Add</button>
      </div> */}
      <ul>
        {links.map((link, index) => (
          <li key={index}>
            <strong>{link.date}:</strong> {link.url}
            <div dangerouslySetInnerHTML={{ __html: link.html }} />
          </li>
        ))}
      </ul>
    </main>
  );
}
