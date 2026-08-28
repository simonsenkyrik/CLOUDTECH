import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Files,
  Folder,
  HardDrive,
  Home,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Menu,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { supabase } from "./lib/supabase";

const LOGIN_URL = "http://127.0.0.1:5500/index.html";
const STORAGE_BUCKET = "user-files";

const PLAN_LIMITS = {
  free: 5 * 1024 ** 3,
  mid: 50 * 1024 ** 3,
  enterprise: 500 * 1024 ** 3,
};

const PLAN_NAMES = {
  free: "Free",
  mid: "Mid",
  enterprise: "Enterprise",
};

const FILTERS = [
  { id: "all", label: "Vše", icon: Files },
  { id: "document", label: "Dokumenty", icon: FileText },
  { id: "image", label: "Obrázky", icon: ImageIcon },
  { id: "video", label: "Videa", icon: Video },
];

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  const decimals = index >= 3 ? 2 : index === 0 ? 0 : 1;

  return `${value.toFixed(decimals)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFileName(file) {
  return file.file_name || file.name || "Soubor";
}

function getFileCategory(file) {
  const mimeType = file.mime_type || file.type || "";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

function sanitizeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon--${tone}`}>
        <Icon size={26} strokeWidth={1.9} />
      </div>

      <div>
        <p className="stat-label">{label}</p>
        <strong className="stat-value">{value}</strong>
        <span className="stat-unit">souborů</span>
      </div>
    </article>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`sidebar-nav-item${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      <Icon size={21} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const fileInputRef = useRef(null);
  const initializedRef = useRef(false);

  const loadFiles = useCallback(async (userId) => {
    if (!userId) return;

    setFilesLoading(true);

    const { data, error } = await supabase
      .from("files")
      .select(
        "id, user_id, file_name, storage_path, file_size, mime_type, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Načtení souborů selhalo:", error.message);
      setNotice({
        type: "error",
        text: "Soubory se nepodařilo načíst. Zkontroluj, zda jsi v Supabase spustil soubor supabase/setup.sql.",
      });
      setFiles([]);
    } else {
      setFiles(data || []);
    }

    setFilesLoading(false);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const checkUser = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          window.location.href = LOGIN_URL;
          return;
        }

        const currentUser = data.session.user;
        setUser(currentUser);

        let { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, plan")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profil se nepodařilo načíst:", profileError.message);
        }

        if (!profileData) {
          const fallbackUsername =
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split("@")[0] ||
            `uzivatel_${currentUser.id.slice(0, 6)}`;

          const { data: createdProfile, error: createProfileError } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              email: currentUser.email,
              username: fallbackUsername,
              plan: "free",
            })
            .select("username, plan")
            .single();

          if (createProfileError) {
            console.error("Profil se nepodařilo vytvořit:", createProfileError.message);
          } else {
            profileData = createdProfile;
          }
        }

        setProfile(
          profileData || {
            username:
              currentUser.user_metadata?.full_name ||
              currentUser.email?.split("@")[0] ||
              "Uživatel",
            plan: "free",
          },
        );

        await loadFiles(currentUser.id);
      } catch (error) {
        console.error("Dashboard chyba:", error);
        setPageError("Nepodařilo se načíst přihlášeného uživatele.");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [loadFiles]);

  const plan = (profile?.plan || "free").toLowerCase();
  const planName = PLAN_NAMES[plan] || "Free";
  const storageLimit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const usedStorage = useMemo(
    () => files.reduce((total, file) => total + Number(file.file_size || 0), 0),
    [files],
  );

  const storagePercent = Math.min(
    100,
    (usedStorage / storageLimit) * 100,
  );

  const storageBarPercent = usedStorage > 0
    ? Math.max(storagePercent, 0.6)
    : 0;

  const storagePercentLabel = storagePercent.toLocaleString("cs-CZ", {
    minimumFractionDigits: storagePercent > 0 && storagePercent < 1 ? 1 : 0,
    maximumFractionDigits: 1,
  });

  const stats = useMemo(
    () => ({
      all: files.length,
      image: files.filter((file) => getFileCategory(file) === "image").length,
      video: files.filter((file) => getFileCategory(file) === "video").length,
      document: files.filter((file) => getFileCategory(file) === "document")
        .length,
    }),
    [files],
  );

  const filteredFiles = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return files.filter((file) => {
      const matchesFilter =
        activeFilter === "all" || getFileCategory(file) === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        getFileName(file).toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, files, searchTerm]);

  const displayName =
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Uživatel";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = LOGIN_URL;
  };

  const scrollToOverview = () => {
    setActiveSection("overview");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToFiles = () => {
    setActiveSection("files");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileSelect = async (event) => {
  const selectedFiles = Array.from(event.target.files || []);
  event.target.value = "";

  if (selectedFiles.length === 0 || !user) return;

  const totalSelectedSize = selectedFiles.reduce(
    (total, file) => total + file.size,
    0,
  );

  if (usedStorage + totalSelectedSize > storageLimit) {
    setNotice({
      type: "error",
      text: `Vybrané soubory nelze nahrát. Tarif ${planName} má limit ${formatBytes(storageLimit)}.`,
    });

    return;
  }

  setUploading(true);

  setNotice({
    type: "info",
    text:
      selectedFiles.length === 1
        ? `Nahrávám soubor ${selectedFiles[0].name}…`
        : `Nahrávám ${selectedFiles.length} souborů…`,
  });

  let uploadedCount = 0;
  const failedFiles = [];

  try {
    for (const selectedFile of selectedFiles) {
      const safeName =
        sanitizeFileName(selectedFile.name) || "soubor";

      const storagePath =
        `${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            selectedFile.type || "application/octet-stream",
        });

      if (uploadError) {
        console.error(
          `Upload souboru ${selectedFile.name} selhal:`,
          uploadError.message,
        );

        failedFiles.push(selectedFile.name);
        continue;
      }

      const { error: databaseError } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          storage_path: storagePath,
          file_size: selectedFile.size,
          mime_type:
            selectedFile.type || "application/octet-stream",
        });

      if (databaseError) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        console.error(
          `Metadata souboru ${selectedFile.name} nebyla uložena:`,
          databaseError.message,
        );

        failedFiles.push(selectedFile.name);
        continue;
      }

      uploadedCount += 1;
    }

    await loadFiles(user.id);

    if (failedFiles.length > 0) {
      setNotice({
        type: "error",
        text:
          `Nahráno ${uploadedCount} z ${selectedFiles.length} souborů. ` +
          `Nepodařilo se nahrát: ${failedFiles.join(", ")}.`,
      });
    } else if (uploadedCount === 1) {
      setNotice({
        type: "success",
        text: `Soubor ${selectedFiles[0].name} byl úspěšně nahrán.`,
      });
    } else {
      setNotice({
        type: "success",
        text: `Vybrané soubory (${uploadedCount}) byly úspěšně nahrány.`,
      });
    }
  } finally {
    setUploading(false);
  }
};

  const handleDownload = async (file) => {
    setNotice({ type: "info", text: `Připravuji stažení souboru ${getFileName(file)}…` });

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(file.storage_path);

    if (error) {
      setNotice({ type: "error", text: `Stažení selhalo: ${error.message}` });
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getFileName(file);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    setNotice({ type: "success", text: "Soubor byl připraven ke stažení." });
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(
      `Opravdu chceš trvale smazat soubor „${getFileName(file)}“?`,
    );

    if (!confirmed) return;

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([file.storage_path]);

    if (storageError) {
      setNotice({ type: "error", text: `Smazání selhalo: ${storageError.message}` });
      return;
    }

    const { error: databaseError } = await supabase
      .from("files")
      .delete()
      .eq("id", file.id)
      .eq("user_id", user.id);

    if (databaseError) {
      setNotice({
        type: "error",
        text: `Metadata souboru se nepodařilo smazat: ${databaseError.message}`,
      });
      return;
    }

    setFiles((currentFiles) => currentFiles.filter((item) => item.id !== file.id));
    setNotice({ type: "success", text: "Soubor byl smazán." });
  };

  if (loading) {
    return (
      <div className="dashboard-state">
        <div className="dashboard-loader" />
        <p>Načítání dashboardu…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="dashboard-state">
        <h1>Nepodařilo se otevřít dashboard</h1>
        <p>{pageError}</p>
        <Button className="upload-button" onClick={() => (window.location.href = LOGIN_URL)}>
          Zpět na přihlášení
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        className={`sidebar-overlay${sidebarOpen ? " is-visible" : ""}`}
        aria-label="Zavřít navigaci"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`dashboard-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="sidebar-top-row">
          <div className="sidebar-logo">
            <a href="/" className="sidebar-logo" aria-label="Načíst přehled CLOUDTECH">
              <img src="/cloudtech-logo.png" alt="CLOUDTECH"/>
            </a>
          </div>
          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Zavřít menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-title">Navigace</p>
          <nav className="sidebar-nav" aria-label="Hlavní navigace">
            <NavItem
              icon={Home}
              label="Přehled"
              active={activeSection === "overview"}
              onClick={scrollToOverview}
            />
            <NavItem
              icon={Folder}
              label="Moje soubory"
              active={activeSection === "files"}
              onClick={scrollToFiles}
            />
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-title">Úložiště</p>
          <div className="storage-card">
            <div className="storage-heading">
              <span>Využito</span>
              <strong>
                {formatBytes(usedStorage)} z {formatBytes(storageLimit)}
              </strong>
            </div>

            <div
              className="storage-progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Number(storagePercent.toFixed(1))}
              aria-label="Využití úložiště"
            >
              <span style={{ width: `${storageBarPercent}%` }} />
            </div>

            <p>{storagePercentLabel} % využito</p>
          </div>
        </div>

        <div className="plan-card">
          <div className="plan-card-heading">
            <span>Tarif</span>
            <strong>{planName}</strong>
          </div>
          <p>Aktivní úroveň služby</p>
          <div className="plan-feature">
            <HardDrive size={17} />
            <span>{formatBytes(storageLimit)} prostoru</span>
          </div>
        </div>

        <div className="sidebar-spacer" />

        <div className="user-card">
          <div className="user-summary">
            <div className="user-avatar">{initials || "U"}</div>
            <div className="user-details">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Odhlásit se
          </Button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-title-row">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Otevřít navigaci"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <div>
                <h1>
                  {activeSection === "overview" ? (
                  <>Vítej, {displayName}!</>
                  ) : (
                  "Moje soubory"
                  )}
                </h1>
                  <p>
                    {activeSection === "overview"
                      ? "Zde je přehled tvého úložiště."
                      : "Zde můžeš vyhledávat, filtrovat a spravovat své soubory."}
                  </p>
              </div>
            </div>
          </div>  


          <div className="dashboard-header-actions">
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              multiple
              onChange={handleFileSelect}
            />

            <Button
              type="button"
              className="upload-button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="spin-icon" size={19} /> : <Upload size={19} />}
              {uploading ? "Nahrávám…" : "Nahrát soubory"}
            </Button>
          </div>
        </header>

{activeSection === "overview" && (
  <section className="stats-grid" aria-label="Statistiky souborů">
    <StatCard
      icon={Files}
      label="Celkem souborů"
      value={stats.all}
      tone="blue"
    />

    <StatCard
      icon={ImageIcon}
      label="Obrázky"
      value={stats.image}
      tone="green"
    />

    <StatCard
      icon={Video}
      label="Videa"
      value={stats.video}
      tone="purple"
    />

    <StatCard
      icon={FileText}
      label="Dokumenty"
      value={stats.document}
      tone="orange"
    />
    </section>
)}

        <section className="files-toolbar" aria-label="Vyhledávání a filtry">
          <div className="search-control">
            <Search size={20} />
            <Input
              className="search-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Hledat soubory…"
              aria-label="Hledat soubory"
            />
          </div>

          <div className="filter-group">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`filter-button${activeFilter === id ? " is-active" : ""}`}
                onClick={() => setActiveFilter(id)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {notice && (
          <div className={`dashboard-notice dashboard-notice--${notice.type}`} role="status">
            {notice.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : notice.type === "error" ? (
              <AlertCircle size={19} />
            ) : (
              <Loader2 className={uploading ? "spin-icon" : ""} size={19} />
            )}
            <span>{notice.text}</span>
            <button type="button" aria-label="Zavřít zprávu" onClick={() => setNotice(null)}>
              <X size={17} />
            </button>
          </div>
        )}

          <section className="files-panel" id="files">
            <div className="files-panel-header">
            <div>
              <h2>Moje soubory</h2>
              <p>{filteredFiles.length} zobrazených souborů</p>
            </div>
          </div>

          {filesLoading ? (
            <div className="files-loading">
              <Loader2 className="spin-icon" size={32} />
              <p>Načítání souborů…</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={46} strokeWidth={1.5} />
              </div>
              <h3>Zatím nemáte žádné soubory</h3>
              <p>Pro nahrání prvních souborů použijte tlačítko „Nahrát soubory“ vpravo nahoře.</p>
            </div>
          ) : (
            <div className="file-table" role="table" aria-label="Seznam souborů">
              <div className="file-table-row file-table-head" role="row">
                <span>Název</span>
                <span>Typ</span>
                <span>Velikost</span>
                <span>Nahráno</span>
                <span>Akce</span>
              </div>

              {filteredFiles.map((file) => {
                const category = getFileCategory(file);
                const CategoryIcon =
                  category === "image"
                    ? ImageIcon
                    : category === "video"
                      ? Video
                      : FileText;

                return (
                  <div className="file-table-row" role="row" key={file.id}>
                    <div className="file-name-cell">
                      <div className={`file-type-icon file-type-icon--${category}`}>
                        <CategoryIcon size={19} />
                      </div>
                      <strong title={getFileName(file)}>{getFileName(file)}</strong>
                    </div>
                    <span>{category === "image" ? "Obrázek" : category === "video" ? "Video" : "Dokument"}</span>
                    <span>{formatBytes(file.file_size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                    <div className="file-actions">
                      <button
                        type="button"
                        className="file-action-button"
                        aria-label={`Stáhnout ${getFileName(file)}`}
                        title="Stáhnout"
                        onClick={() => handleDownload(file)}
                      >
                        <Download size={18} />
                      </button>
                      <button
                        type="button"
                        className="file-action-button file-action-button--red"
                        aria-label={`Smazat ${getFileName(file)}`}
                        title="Smazat"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
