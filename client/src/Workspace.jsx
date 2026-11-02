import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function Workspace() {
  const [user, setUser] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("creatorconnectToken");

  useEffect(() => {
    const savedUser = localStorage.getItem("creatorconnectUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    async function loadBriefs() {
      try {
        const response = await fetch(`${API_URL}/briefs`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load briefs");
        }

        setBriefs(data.briefs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBriefs();
  }, []);

  function logout() {
    localStorage.removeItem("creatorconnectToken");
    localStorage.removeItem("creatorconnectUser");
    window.location.href = "/";
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2>✦ CreatorConnect AI</h2>
        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </header>

      <main style={styles.container}>
        <section style={styles.welcome}>
          <p style={styles.tag}>YOUR CREATIVE WORKSPACE</p>
          <h1>Welcome, {user?.name || "User"}!</h1>
          <p>
            Manage your creative projects and discover new opportunities.
          </p>
          <span style={styles.role}>
            Account: {user?.role || "User"}
          </span>
        </section>

        <section style={styles.stats}>
          <div style={styles.card}>
            <h3>{briefs.length}</h3>
            <p>Available Briefs</p>
          </div>

          <div style={styles.card}>
            <h3>{user?.role === "creator" ? "Creator" : "Brand"}</h3>
            <p>Account Type</p>
          </div>

          <div style={styles.card}>
            <h3>Active</h3>
            <p>Account Status</p>
          </div>
        </section>

        <section style={styles.section}>
          <h2>Available Brand Opportunities</h2>
          <p>Explore the latest projects posted by brands.</p>

          {loading && <p>Loading opportunities...</p>}

          {error && <p style={styles.error}>{error}</p>}

          {!loading && !error && briefs.length === 0 && (
            <p>No opportunities available yet.</p>
          )}

          <div style={styles.briefGrid}>
            {briefs.map((brief) => (
              <article key={brief._id} style={styles.brief}>
                <span style={styles.category}>{brief.category}</span>
                <h3>{brief.title}</h3>
                <p>{brief.description}</p>

                <p>
                  <strong>Brand:</strong>{" "}
                  {brief.brand?.name || "Brand"}
                </p>

                <p>
                  <strong>Budget:</strong> ₹{brief.budget}
                </p>

                <p>
                  <strong>Skills:</strong>{" "}
                  {brief.requiredSkills?.join(", ") || "Not specified"}
                </p>

                <p>
                  <strong>Status:</strong> {brief.status}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#202b40",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    background: "#ffffff",
    padding: "18px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
  },
  logout: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#263b70",
    color: "white",
    cursor: "pointer",
  },
  container: {
    maxWidth: "1150px",
    margin: "auto",
    padding: "35px 20px",
  },
  welcome: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "15px",
    marginBottom: "25px",
  },
  tag: {
    color: "#6253c7",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  role: {
    display: "inline-block",
    marginTop: "12px",
    padding: "8px 14px",
    background: "#eeecff",
    color: "#5141a5",
    borderRadius: "20px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "35px",
  },
  card: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "12px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  section: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "15px",
  },
  briefGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginTop: "25px",
  },
  brief: {
    padding: "22px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#ffffff",
  },
  category: {
    color: "#6253c7",
    fontSize: "13px",
    fontWeight: "bold",
  },
  error: {
    color: "red",
  },
};

export default Workspace;