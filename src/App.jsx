import React, { useState, useEffect } from "react";
import "./App.css";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import DOMPurify from "dompurify";

const firebaseConfig = {
  apiKey: "AIzaSyB4hciZz_3TA1E8wVxKWQRXZRF3kz8N4HY",
  authDomain: "pa-promo-dashboard.firebaseapp.com",
  databaseURL: "https://pa-promo-dashboard-default-rtdb.firebaseio.com",
  projectId: "pa-promo-dashboard",
  storageBucket: "pa-promo-dashboard.appspot.com",
  messagingSenderId: "949344958493",
  appId: "1:949344958493:web:9199f684adb5981f60eef4",
  measurementId: "G-5VBWQXKW6K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);




export default function App() {
  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [groupedLinks, setGroupedLinks] = useState({});

  useEffect(() => {
    readFirestore();
  }, []);

  const readFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "competitor-promotions"));
      const docs = querySnapshot.docs;
      const firestoreLinks = docs.map((doc) => doc.data());

      const formattedLinks = await Promise.all(firestoreLinks.map(async (link) => {
        try {
          const response = await fetch(link.link);
          const html = await response.text();
          return {
            date: link.date.toDate(), // Convert Firestore timestamp to Date object
            link: link.link,
            html: html,
          };
        } catch (error) {
          console.error("Error fetching HTML:", error);
          return null;
        }
      }));

      const validLinks = formattedLinks.filter((link) => link !== null);

      setLinks(validLinks);
      const grouped = groupLinksByDate(validLinks);
      setGroupedLinks(grouped);
      console.log(grouped);
    } catch (error) {
      console.error("Error reading Firestore:", error);
    }
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

  const addLink = async () => {
    try {
      const rawDate = new Date().toLocaleDateString();
      const date = new Date(rawDate);
      const docRef = await addDoc(collection(db, "competitor-promotions"), {
        date: date,
        link: "https://cors-anywhere.herokuapp.com/" + linkInput,
        html: "" // You can update this with your HTML content
      });
      setLinkInput("");
      readFirestore(); // Refresh the data from Firestore
    } catch (error) {
      console.error("Error adding document:", error);
    }
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
      {Object.keys(groupedLinks)
      .sort((a, b) => new Date(b) - new Date(a)) // Sort dates in descending order
      .map((date, index) => (
        <div key={index} className="promo-row">
          <h2>{date}</h2>
          <div className="promo-items">
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
