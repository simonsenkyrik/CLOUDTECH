import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        // pokud není přihlášen → zpět na HTML stránku
        window.location.href = "http://127.0.0.1:5500/index.html";
      } else {
        setUser(data.session.user);
      }
    };

    checkUser();
  }, []);

  if (!user) {
    return <div>Načítání...</div>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>🚀 CLOUDTECH Dashboard</h1>
      <p>Přihlášen jako: {user.email}</p>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "http://127.0.0.1:5500/index.html";
        }}
      >
        Odhlásit se
      </button>
    </div>
  );
}

export default App;