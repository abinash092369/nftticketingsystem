// Updated App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TicketABI from "./TicketABI.json";

const CONTRACT_ADDRESS = "0xEcec245E8b326F41bF9A86Dca5fd681e9022c1d3";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [mintData, setMintData] = useState({ to: "", uri: "", price: "" });
  const [buyId, setBuyId] = useState("");
  const [resale, setResale] = useState({ id: "", price: "" });

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      initContract();
    } else {
      toast.error("Please install MetaMask!");
    }
  };

  const initContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TicketABI, signer);
    setContract(contract);
  };

  const mintTicket = async () => {
    if (!contract) return toast.error("Connect wallet first!");
    try {
      setLoading(true);
      const tx = await contract.mintTicket(mintData.to, mintData.uri, ethers.parseEther(mintData.price));
      await tx.wait();
      toast.success("🎟️ Ticket minted successfully!");
      setMintData({ to: "", uri: "", price: "" });
    } catch (err) {
      toast.error(err.reason || "Mint failed");
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async () => {
    try {
      const price = await contract.getTicketPrice(buyId);
      const tx = await contract.buyTicket(buyId, { value: price });
      await tx.wait();
      toast.success("✅ Ticket purchased!");
    } catch (err) {
      toast.error("Purchase failed");
    }
  };

  const listForSale = async () => {
    try {
      const tx = await contract.listForSale(resale.id, ethers.parseEther(resale.price));
      await tx.wait();
      toast.success("🔁 Ticket listed for resale!");
    } catch (err) {
      toast.error("Listing failed");
    }
  };

  const loadTickets = async () => {
    try {
      const total = 10;
      const ticketArr = [];
      for (let i = 1; i <= total; i++) {
        const uri = await contract.tokenURI(i).catch(() => null);
        if (uri) {
          const price = await contract.getTicketPrice(i);
          const forSale = await contract.isForSale(i);
          const owner = await contract.ownerOf(i);
          ticketArr.push({ id: i, uri, price: ethers.formatEther(price), forSale, owner });
        }
      }
      setTickets(ticketArr);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { if (contract) loadTickets(); }, [contract]);

  return (
    <div style={styles.container}>
      <ToastContainer />
      <h1 style={styles.title}>🎟️ NFT Ticketing System</h1>

      {!account ? (
        <button onClick={connectWallet} style={styles.button}>Connect Wallet</button>
      ) : (
        <p>Connected</p>
      )}

      <div style={styles.card}>
        <h3>Mint New Ticket</h3>
        <input placeholder="Recipient address" value={mintData.to} onChange={(e) => setMintData({ ...mintData, to: e.target.value })} style={styles.input} />
        <input placeholder="Metadata URI (IPFS)" value={mintData.uri} onChange={(e) => setMintData({ ...mintData, uri: e.target.value })} style={styles.input} />
        <input placeholder="Ticket Price (ETH)" value={mintData.price} onChange={(e) => setMintData({ ...mintData, price: e.target.value })} style={styles.input} />
        <button onClick={mintTicket} style={styles.button}>Mint Ticket</button>
      </div>

      <div style={styles.card}>
        <h3>Buy Ticket</h3>
        <input placeholder="Ticket ID" value={buyId} onChange={(e) => setBuyId(e.target.value)} style={styles.input} />
        <button onClick={buyTicket} style={styles.button}>Buy</button>
      </div>

      <div style={styles.card}>
        <h3>List for Resale</h3>
        <input placeholder="Ticket ID" value={resale.id} onChange={(e) => setResale({ ...resale, id: e.target.value })} style={styles.input} />
        <input placeholder="New Price (ETH)" value={resale.price} onChange={(e) => setResale({ ...resale, price: e.target.value })} style={styles.input} />
        <button onClick={listForSale} style={styles.button}>List</button>
      </div>

      <div style={styles.ticketsContainer}>
        {tickets.map((t) => (
          <div key={t.id} style={styles.ticket}>
            <h4>Ticket #{t.id}</h4>
            <p>URI: {t.uri}</p>
            <p>Price: {t.price} ETH</p>
            <p>Status: {t.forSale ? "For Sale" : "Not for Sale"}</p>
            <p>Owner: {t.owner}</p>
          </div>
        ))}
      </div>

      {loading && <p>⏳ Processing...</p>}
    </div>
  );
}

const styles = {
  container: { fontFamily: "Arial", padding: "30px", textAlign: "center" },
  title: { fontSize: "28px", marginBottom: "20px" },
  button: { padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "10px" },
  input: { width: "80%", padding: "10px", margin: "8px", border: "1px solid #ccc", borderRadius: "8px" },
  card: { background: "#f8f9fa", padding: "20px", borderRadius: "12px", marginBottom: "20px", maxWidth: "500px", margin: "0 auto" },
  ticketsContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" },
  ticket: { border: "1px solid #ddd", borderRadius: "12px", padding: "15px" },
};

export default App;