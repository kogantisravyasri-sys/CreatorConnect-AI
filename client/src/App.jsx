import { useEffect, useState } from "react";
import "./App.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function BrandLogo() {
  return (
    <a href="/" className="brand">
      <span className="brand-symbol">✦</span>
      <span className="brand-name">CreatorConnect<span> AI</span></span>
    </a>
  );
}

/* LOGIN AND REGISTRATION */
function AuthModal({ initialMode, onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState("brand");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    const payload = mode === "signup"
      ? {
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role
        }
      : {
          email: form.get("email"),
          password: form.get("password")
        };

    try {
      const response = await fetch(
        `${API_URL}/auth/${mode === "signup" ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (mode === "signup") {
        setMessage("Account created successfully. Please sign in.");
        setMode("login");
        return;
      }

      localStorage.setItem("creatorconnectToken", data.token);
      localStorage.setItem("creatorconnectUser", JSON.stringify(data.user));
      onAuthenticated(data.user);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <section className="auth-panel">
        <button type="button" className="close-modal" onClick={onClose}>×</button>
        <BrandLogo />
        <span className="section-label">ACCOUNT ACCESS</span>
        <h2>{mode === "signup" ? "Create your account." : "Welcome back."}</h2>

        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label>Full name</label>
              <input name="name" placeholder="Your name" required />

              <label>Register as</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="brand">Brand</option>
                <option value="creator">Creator</option>
              </select>
            </>
          )}

          <label>Email address</label>
          <input name="email" type="email" required />

          <label>Password</label>
          <input name="password" type="password" minLength="8" required />

          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        {message && <div className="form-message">{message}</div>}

        <p className="auth-toggle">
          {mode === "signup" ? "Already registered?" : "New to CreatorConnect AI?"}
          {" "}
          <button type="button" onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
          }}>
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </div>
  );
}

/* ADMIN LOGIN */
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Admin login failed");

      localStorage.setItem("creatorconnectAdminToken", data.token);
      localStorage.setItem("creatorconnectAdminUser", JSON.stringify(data.user));
      onLogin(data.user);

    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="admin-screen">
      <section className="admin-panel">
        <BrandLogo />
        <h1>Administrator login</h1>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          <button className="btn btn-primary btn-full">Sign in</button>
        </form>

        {message && <p className="form-message">{message}</p>}
        <a href="/">Return home</a>
      </section>
    </main>
  );
}

/* ADMIN DASHBOARD */
function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    users: 0,
    creators: 0,
    brands: 0,
    campaigns: 0,
    applications: 0
  });
  const [users, setUsers] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const adminToken = localStorage.getItem("creatorconnectAdminToken");

  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`
  };

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...adminHeaders,
        ...(options.headers || {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load admin data");
    }

    return data;
  }

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const [
        statsData,
        usersData,
        campaignsData,
        applicationsData
      ] = await Promise.all([
        requestJson(`${API_URL}/admin/stats`),
        requestJson(`${API_URL}/admin/users`),
        requestJson(`${API_URL}/admin/campaigns`),
        requestJson(`${API_URL}/admin/applications`)
      ]);

      setStats(statsData.stats || {});
      setUsers(usersData.users || []);
      setBriefs(campaignsData.briefs || campaignsData.campaigns || []);
      setApplications(applicationsData.applications || []);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function deleteCampaign(brief) {
    const confirmed = window.confirm(
      `Delete campaign "${brief.title}" and all applications linked to it? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(brief._id);
    setMessage("");

    try {
      const data = await requestJson(
        `${API_URL}/admin/campaigns/${brief._id}`,
        { method: "DELETE" }
      );

      setMessage(data.message || "Campaign deleted successfully.");
      await loadDashboard();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  const statCards = [
    ["Total users", stats.users, "Registered creators and brands"],
    ["Creators", stats.creators, "Creator accounts"],
    ["Brands", stats.brands, "Brand accounts"],
    ["Campaigns", stats.campaigns, "Published campaigns"],
    ["Applications", stats.applications, "Creator applications"]
  ];

  const tabs = [
    ["overview", "Overview"],
    ["users", "Users"],
    ["campaigns", "Campaigns"],
    ["applications", "Applications"]
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandLogo />

          <div className="header-actions">
            <span>{admin.name || "Administrator"}</span>
            <button className="btn btn-primary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="section" style={{ paddingTop: "45px", paddingBottom: "80px" }}>
        <span className="section-label">CREATORCONNECT AI CONTROL CENTER</span>
        <h1>Admin Dashboard</h1>
        <p>Monitor platform activity and manage marketplace records.</p>

        <nav style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          margin: "25px 0"
        }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </nav>

        {message && (
          <div className="form-message" role="status">{message}</div>
        )}

        {loading ? (
          <p>Loading admin dashboard...</p>
        ) : (
          <>
            {activeTab === "overview" && (
              <section>
                <h2>Platform overview</h2>

                <div className="pricing-grid">
                  {statCards.map(([label, value, description]) => (
                    <article className="pricing-card" key={label}>
                      <span className="pricing-label">{label}</span>
                      <h2 style={{ fontSize: "2rem", margin: "12px 0" }}>
                        {value ?? 0}
                      </h2>
                      <p>{description}</p>
                    </article>
                  ))}
                </div>

                <div style={{ marginTop: "35px" }}>
                  <h2>Recent campaigns</h2>

                  {briefs.length === 0 ? (
                    <p>No campaigns have been published yet.</p>
                  ) : (
                    <div className="pricing-grid">
                      {briefs.slice(0, 3).map(brief => (
                        <article className="pricing-card" key={brief._id}>
                          <h3>{brief.title}</h3>
                          <p>{brief.description}</p>
                          <p><strong>Brand:</strong> {brief.brand?.name || "Brand"}</p>
                          <p><strong>Budget:</strong> ₹{brief.budget}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "users" && (
              <section>
                <h2>Registered users ({users.length})</h2>

                {users.length === 0 ? (
                  <p>No registered users found.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: "#fff"
                    }}>
                      <thead>
                        <tr>
                          {["Name", "Email", "Role", "Registered"].map(item => (
                            <th
                              key={item}
                              style={{
                                textAlign: "left",
                                padding: "13px",
                                borderBottom: "1px solid #ddd"
                              }}
                            >
                              {item}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {users.map(person => (
                          <tr key={person._id}>
                            <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                              {person.name}
                            </td>
                            <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                              {person.email}
                            </td>
                            <td style={{
                              padding: "13px",
                              borderBottom: "1px solid #eee",
                              textTransform: "capitalize"
                            }}>
                              {person.role}
                            </td>
                            <td style={{ padding: "13px", borderBottom: "1px solid #eee" }}>
                              {person.createdAt
                                ? new Date(person.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === "campaigns" && (
              <section>
                <h2>Campaign management ({briefs.length})</h2>

                {briefs.length === 0 ? (
                  <p>No campaigns available.</p>
                ) : (
                  <div className="pricing-grid">
                    {briefs.map(brief => (
                      <article className="pricing-card" key={brief._id}>
                        <span className="pricing-label">
                          {brief.category || "Campaign"}
                        </span>

                        <h3>{brief.title}</h3>
                        <p>{brief.description}</p>
                        <p><strong>Budget:</strong> ₹{brief.budget}</p>
                        <p><strong>Brand:</strong> {brief.brand?.name || "Brand"}</p>
                        <p><strong>Status:</strong> {brief.status || "Published"}</p>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={deletingId === brief._id}
                          onClick={() => deleteCampaign(brief)}
                          style={{ marginTop: "12px" }}
                        >
                          {deletingId === brief._id ? "Deleting..." : "Delete campaign"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "applications" && (
              <section>
                <h2>Creator applications ({applications.length})</h2>

                {applications.length === 0 ? (
                  <p>No applications found.</p>
                ) : (
                  <div className="pricing-grid">
                    {applications.map(application => (
                      <article className="pricing-card" key={application._id}>
                        <span className="pricing-label">
                          {application.status || "Pending"}
                        </span>

                        <h3>{application.creator?.name || "Creator"}</h3>

                        <p>
                          <strong>Creator email:</strong>{" "}
                          {application.creator?.email || "—"}
                        </p>

                        <p>
                          <strong>Campaign:</strong>{" "}
                          {application.brief?.title || "Campaign no longer available"}
                        </p>

                        <p>
                          <strong>Brand:</strong>{" "}
                          {application.brief?.brand?.name || "—"}
                        </p>

                        <p><strong>Proposal:</strong> {application.proposal}</p>

                        {application.portfolio && (
                          <p>
                            <strong>Portfolio:</strong>{" "}
                            <a href={application.portfolio} target="_blank" rel="noreferrer">
                              View portfolio
                            </a>
                          </p>
                        )}

                        <p>
                          <strong>Submitted:</strong>{" "}
                          {application.createdAt
                            ? new Date(application.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* CREATOR AND BRAND WORKSPACE */
function Workspace({ user, onLogout }) {
  const [briefs, setBriefs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [proposal, setProposal] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [activeChat, setActiveChat] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    requiredSkills: ""
  });

  const token = localStorage.getItem("creatorconnectToken");
  const authHeaders = { Authorization: `Bearer ${token}` };

  async function loadWorkspace() {
    setLoading(true);
    setMessage("");

    try {
      const briefResponse = await fetch(`${API_URL}/briefs`);
      const briefData = await briefResponse.json();

      if (!briefResponse.ok) {
        throw new Error(briefData.message || "Unable to load campaigns");
      }

      setBriefs(briefData.briefs || []);

      const endpoint = user.role === "creator"
        ? `${API_URL}/applications/creator/my`
        : `${API_URL}/applications/brand/my`;

      const applicationResponse = await fetch(endpoint, {
        headers: authHeaders
      });

      const applicationData = await applicationResponse.json();

      if (!applicationResponse.ok) {
        throw new Error(applicationData.message || "Unable to load applications");
      }

      setApplications(applicationData.applications || []);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [user.role]);

  function updateForm(event) {
    setForm(previous => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  /* BRAND CREATES CAMPAIGN */
  async function createBrief(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/briefs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          requiredSkills: form.requiredSkills
            .split(",").map(skill => skill.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not publish campaign");

      setForm({
        title: "",
        description: "",
        category: "",
        budget: "",
        requiredSkills: ""
      });

      setMessage("Campaign published successfully!");
      await loadWorkspace();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* CREATOR APPLIES */
  async function applyToCampaign(event) {
    event.preventDefault();
    if (!selectedBrief) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${selectedBrief._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders
          },
          body: JSON.stringify({ proposal, portfolio })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Application failed");

      setSelectedBrief(null);
      setProposal("");
      setPortfolio("");
      setMessage("Application submitted successfully!");
      await loadWorkspace();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* BRAND ACCEPTS OR REJECTS */
  async function updateApplicationStatus(applicationId, status) {
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update application");

      setMessage(`Application ${status.toLowerCase()} successfully!`);
      await loadWorkspace();

    } catch (error) {
      setMessage(error.message);
    }
  }

  /* OPEN INTERNAL CHAT */
  function openChat(application) {
    setMessage("");
    setActiveChat(application);
  }

  const appliedBriefIds = new Set(
    applications.map(application =>
      String(application.brief?._id || application.brief)
    )
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandLogo />
          <div className="header-actions">
            <span>{user.name} ({user.role})</span>
            <button className="btn btn-primary" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="section" style={{ paddingTop: "55px", paddingBottom: "80px" }}>
        <span className="section-label">CREATORCONNECT AI WORKSPACE</span>
        <h1>Welcome, {user.name}.</h1>

        <p>
          {user.role === "brand"
            ? "Publish campaigns and manage creator applications."
            : "Discover campaigns and connect with brands."}
        </p>

        {message && (
          <div className="form-message" role="status">{message}</div>
        )}

        {/* BRAND CAMPAIGN CREATION */}
        {user.role === "brand" && (
          <section style={{ marginTop: "35px", maxWidth: "650px" }}>
            <h2>Publish a campaign</h2>

            <form className="form-stack" onSubmit={createBrief}>
              <label>Campaign title</label>
              <input name="title" value={form.title} onChange={updateForm} required />

              <label>Description</label>
              <textarea name="description" value={form.description} onChange={updateForm} rows="4" required />

              <label>Category</label>
              <input name="category" value={form.category} onChange={updateForm} required />

              <label>Budget</label>
              <input name="budget" type="number" min="1" value={form.budget} onChange={updateForm} required />

              <label>Required skills</label>
              <input name="requiredSkills" value={form.requiredSkills} onChange={updateForm} placeholder="Video editing, Design, Marketing" />

              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Publishing..." : "Publish campaign"}
              </button>
            </form>
          </section>
        )}

        {/* AVAILABLE CAMPAIGNS */}
        <section style={{ marginTop: "45px" }}>
          <h2>{user.role === "brand" ? "Available campaigns" : "Explore campaigns"}</h2>

          {loading ? (
            <p>Loading campaigns...</p>
          ) : briefs.length === 0 ? (
            <p>No campaigns available yet.</p>
          ) : (
            <div className="pricing-grid">
              {briefs.map(brief => {
                const alreadyApplied = appliedBriefIds.has(String(brief._id));
                const ownCampaign =
                  String(brief.brand?._id || brief.brand) ===
                  String(user.id || user._id);

                return (
                  <article className="pricing-card" key={brief._id}>
                    <span className="pricing-label">{brief.category}</span>
                    <h3>{brief.title}</h3>
                    <p>{brief.description}</p>
                    <p><strong>Budget:</strong> ₹{brief.budget}</p>
                    <p><strong>Brand:</strong> {brief.brand?.name || "Brand"}</p>
                    <p><strong>Skills:</strong> {brief.requiredSkills?.join(", ") || "Not specified"}</p>

                    {user.role === "creator" && (
                      alreadyApplied ? (
                        <button type="button" className="btn btn-secondary btn-full" disabled>
                          Already applied
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-full"
                          disabled={ownCampaign}
                          onClick={() => {
                            setSelectedBrief(brief);
                            setProposal("");
                            setPortfolio("");
                            setMessage("");

                            setTimeout(() => {
                              document.getElementById("application-form")?.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                              });
                            }, 150);
                          }}
                        >
                          {ownCampaign ? "Your campaign" : "Apply now →"}
                        </button>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* CREATOR APPLICATION FORM */}
        {user.role === "creator" && selectedBrief && (
          <section
            id="application-form"
            style={{
              marginTop: "45px",
              maxWidth: "650px",
              padding: "25px",
              border: "1px solid #dedbea",
              borderRadius: "14px",
              background: "#ffffff",
              scrollMarginTop: "40px"
            }}
          >
            <h2>Apply for {selectedBrief.title}</h2>
            <p>Complete the form below to send your application to the brand.</p>

            <form className="form-stack" onSubmit={applyToCampaign}>
              <label>Your proposal</label>
              <textarea
                value={proposal}
                onChange={event => setProposal(event.target.value)}
                rows="5"
                placeholder="Explain why you are suitable for this campaign..."
                required
              />

              <label>Portfolio URL (optional)</label>
              <input
                type="url"
                value={portfolio}
                onChange={event => setPortfolio(event.target.value)}
                placeholder="https://your-portfolio.com"
              />

              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit application"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedBrief(null);
                  setProposal("");
                  setPortfolio("");
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* CREATOR APPLICATIONS */}
        {user.role === "creator" && (
          <section style={{ marginTop: "55px" }}>
            <h2>My applications</h2>

            {applications.length === 0 ? (
              <p>You haven't applied to any campaigns yet.</p>
            ) : (
              <div className="pricing-grid">
                {applications.map(application => (
                  <article className="pricing-card" key={application._id}>
                    <span className="pricing-label">
                      {application.brief?.category || "Campaign"}
                    </span>

                    <h3>{application.brief?.title || "Campaign"}</h3>
                    <p><strong>Proposal:</strong> {application.proposal}</p>

                    {application.portfolio && (
                      <p>
                        <strong>Portfolio:</strong>{" "}
                        <a href={application.portfolio} target="_blank" rel="noreferrer">
                          View portfolio
                        </a>
                      </p>
                    )}

                    <p><strong>Status:</strong> {application.status}</p>

                    {application.status === "Accepted" && (
                      <div>
                        <p>Your application has been accepted!</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openChat(application)}
                        >
                          Message Brand →
                        </button>
                      </div>
                    )}

                    {application.status === "Rejected" && (
                      <p>This application was not selected.</p>
                    )}

                    {application.status === "Pending" && (
                      <p>Waiting for the brand's decision.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* BRAND APPLICATIONS */}
        {user.role === "brand" && (
          <section style={{ marginTop: "55px" }}>
            <h2>Creator applications</h2>

            {applications.length === 0 ? (
              <p>No creators have applied to your campaigns yet.</p>
            ) : (
              <div className="pricing-grid">
                {applications.map(application => (
                  <article className="pricing-card" key={application._id}>
                    <span className="pricing-label">
                      {application.brief?.category || "Campaign"}
                    </span>

                    <h3>{application.creator?.name || "Creator"}</h3>
                    <p><strong>Campaign:</strong> {application.brief?.title || "Campaign"}</p>
                    <p><strong>Proposal:</strong> {application.proposal}</p>

                    {application.portfolio && (
                      <p>
                        <strong>Portfolio:</strong>{" "}
                        <a href={application.portfolio} target="_blank" rel="noreferrer">
                          View portfolio
                        </a>
                      </p>
                    )}

                    <p><strong>Status:</strong> {application.status}</p>

                    {application.status === "Pending" && (
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => updateApplicationStatus(application._id, "Accepted")}
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => updateApplicationStatus(application._id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {application.status === "Accepted" && (
                      <div style={{ marginTop: "15px" }}>
                        <p>Creator accepted! You can now contact them.</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openChat(application)}
                        >
                          Message Creator →
                        </button>
                      </div>
                    )}

                    {application.status === "Rejected" && (
                      <p>This application was rejected.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeChat && (
          <ChatWindow
            application={activeChat}
            user={user}
            token={token}
            onClose={() => setActiveChat(null)}
          />
        )}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: "35px" }}
          onClick={loadWorkspace}
        >
          ↻ Refresh workspace
        </button>
      </main>
    </div>
  );
}

/* INTERNAL CHAT WINDOW */
function ChatWindow({ application, user, token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const applicationId = application._id;

  const otherName = user.role === "creator"
    ? application.brief?.brand?.name || "Brand"
    : application.creator?.name || "Creator";

  async function loadMessages(showLoader = false) {
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/messages/${applicationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load messages");
      }

      setMessages(data.messages || []);
      setError("");

    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages(true);

    const timer = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [applicationId]);

  async function sendMessage(event) {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/messages/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: trimmed })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Message could not be sent");
      }

      setText("");
      await loadMessages(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(15, 23, 42, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <section style={{
        width: "min(560px, 100%)",
        height: "min(680px, 90vh)",
        background: "#fff",
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)"
      }}>
        <header style={{
          padding: "18px 22px",
          borderBottom: "1px solid #e8e8ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Chat with {otherName}</h2>
            <small>{application.brief?.title || "Campaign collaboration"}</small>
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </header>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777", marginTop: "35px" }}>
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map(item => {
              const mine =
                String(item.sender?._id || item.sender) ===
                String(user.id || user._id);

              return (
                <div
                  key={item._id}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    background: mine ? "#e9e7ff" : "#f1f3f5",
                    overflowWrap: "anywhere"
                  }}
                >
                  <small style={{
                    display: "block",
                    fontWeight: 700,
                    marginBottom: "4px"
                  }}>
                    {mine ? "You" : item.sender?.name || otherName}
                  </small>

                  <div>{item.text}</div>

                  <small style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#777"
                  }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </small>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <p className="form-message" style={{ margin: "0 16px 8px" }}>
            {error}
          </p>
        )}

        <form onSubmit={sendMessage} style={{
          display: "flex",
          gap: "10px",
          padding: "14px",
          borderTop: "1px solid #e8e8ef"
        }}>
          <input
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder="Type your message..."
            maxLength="2000"
            required
            style={{ flex: 1, minWidth: 0 }}
          />

          <button
            className="btn btn-primary"
            disabled={sending || !text.trim()}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

/* MAIN APPLICATION */
function App() {
  const [authMode, setAuthMode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("creatorconnectUser"));
    } catch {
      return null;
    }
  });

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("creatorconnectAdminUser"));
    } catch {
      return null;
    }
  });

  const isAdminPath = window.location.pathname.startsWith("/admin");

  function logout() {
    localStorage.removeItem("creatorconnectToken");
    localStorage.removeItem("creatorconnectUser");
    setUser(null);
  }

  function adminLogout() {
    localStorage.removeItem("creatorconnectAdminToken");
    localStorage.removeItem("creatorconnectAdminUser");
    setAdmin(null);
    window.history.replaceState({}, "", "/admin/login");
  }

  if (isAdminPath) {
    if (admin && localStorage.getItem("creatorconnectAdminToken")) {
      return <AdminDashboard admin={admin} onLogout={adminLogout} />;
    }

    return <AdminLogin onLogin={setAdmin} />;
  }

  if (user && localStorage.getItem("creatorconnectToken")) {
    return <Workspace user={user} onLogout={logout} />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandLogo />

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>

          <nav className={`main-navigation ${mobileMenuOpen ? "navigation-open" : ""}`}>
            <a href="#home">Home</a>
            <a href="#services">Marketplace</a>
            <a href="#process">How it works</a>
            <a href="#about">About</a>
            <a href="/admin/login">Admin Login</a>
          </nav>

          <div className="header-actions">
            <button className="btn btn-quiet" onClick={() => setAuthMode("login")}>
              Login
            </button>

            <button className="btn btn-primary" onClick={() => setAuthMode("signup")}>
              Join marketplace →
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-label">THE CREATOR-BRAND MARKETPLACE</div>

              <h1>
                Ideas meet talent.
                <br />
                <span className="hero-gradient">Campaigns create impact.</span>
              </h1>

              <p className="hero-description">
                CreatorConnect AI brings brands and independent creators
                together through structured campaigns, AI-assisted ideation
                and human-led creative execution.
              </p>

              <div className="hero-buttons">
                <button className="btn btn-primary btn-large" onClick={() => setAuthMode("signup")}>
                  Join the marketplace →
                </button>

                <a href="#process" className="btn btn-secondary btn-large">
                  Explore the platform
                </a>
              </div>
            </div>

            <div className="hero-art">
              <div className="hero-image-card">
                <img
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85"
                  alt="Creative professionals collaborating"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="section-heading">
            <span className="section-label">PLATFORM CAPABILITIES</span>
            <h2>A marketplace built for meaningful collaboration.</h2>
            <p>
              A shared environment where brands define their needs,
              creators contribute expertise and AI supports the process.
            </p>
          </div>

          <div className="services-layout">
            <div className="service-list">
              {[
                ["01", "Campaign Management", "Brands publish campaign briefs with objectives and budgets."],
                ["02", "AI-Assisted Content", "Explore creative concepts and content ideas."],
                ["03", "Creator Collaboration", "Connect brands with independent creators."],
                ["04", "Project Evaluation", "Review submissions and approve deliverables."]
              ].map(item => (
                <article className="service-row" key={item[0]}>
                  <span>{item[0]}</span>
                  <div>
                    <h3>{item[1]}</h3>
                    <p>{item[2]}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="section">
            <div className="section-heading">
              <span className="section-label">HOW IT WORKS</span>
              <h2>From opportunity to completed campaign.</h2>
            </div>

            <div className="process-grid">
              {[
                "Brands publish campaign requirements.",
                "Creators apply for relevant opportunities.",
                "Creators develop content for the campaign.",
                "Brands review and approve submissions."
              ].map((step, index) => (
                <article className="process-card" key={index}>
                  <span>0{index + 1}</span>
                  <p>{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section human-section" id="about">
          <div className="human-copy">
            <span className="section-label">AI + HUMAN COLLABORATION</span>
            <h2>Technology supports creativity. People shape the outcome.</h2>
            <p>
              CreatorConnect AI combines AI-assisted content ideation
              with the skills and judgment of independent creators.
              Brands retain control over campaign requirements and approval.
            </p>
            <button className="btn btn-primary" onClick={() => setAuthMode("signup")}>
              Create an account →
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section footer-main">
          <div className="footer-brand-area">
            <BrandLogo />
            <p>
              An AI-assisted marketplace connecting brands,
              creators and campaign opportunities.
            </p>
          </div>

          <div className="footer-column">
            <h4>PLATFORM</h4>
            <a href="#services">Capabilities</a>
            <a href="#process">How it works</a>
            <a href="#about">About</a>
          </div>

          <div className="footer-column">
            <h4>ACCOUNT</h4>
            <button onClick={() => setAuthMode("login")}>Login</button>
            <button onClick={() => setAuthMode("signup")}>Register</button>
          </div>
        </div>

        <div className="footer-bottom section">
          © {new Date().getFullYear()} CreatorConnect AI
        </div>
      </footer>

      {authMode && (
        <AuthModal
          key={authMode}
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={loggedInUser => {
            setUser(loggedInUser);
            setAuthMode(null);
          }}
        />
      )}
    </div>
  );
}

export default App;