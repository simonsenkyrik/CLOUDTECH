import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

function AdminUsers({ adminUsers, usersLoading, onPlanChange, onApproveUser }) {
  const [selectedPlans, setSelectedPlans] = useState({});

  const [openPlanId, setOpenPlanId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".admin-plan-select-wrap")) {
        setOpenPlanId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPlanLabel = (plan) => {
    if (plan === "mid") return "Mid";
    if (plan === "enterprise") return "Enterprise";
    return "Free";
  };

  const handleSelectPlan = (userId, plan) => {
    setSelectedPlans((current) => ({
      ...current,
      [userId]: plan,
    }));

    setOpenPlanId(null);
  };

  return (
    <section className="files-panel admin-users-panel">
      <div className="files-panel-header admin-users-header">
        <div>
          <h2>Správa uživatelů</h2>
          <p>{adminUsers.length} registrovaných uživatelů</p>
        </div>
      </div>

      {usersLoading ? (
        <div className="files-loading">
          <Loader2 className="spin-icon" size={32} />
          <p>Načítání uživatelů…</p>
        </div>
      ) : adminUsers.length === 0 ? (
        <div className="empty-state">
          <h3>Žádní uživatelé</h3>
          <p>V databázi zatím nejsou žádní registrovaní uživatelé.</p>
        </div>
      ) : (
        <div
          className="admin-users-table"
          role="table"
          aria-label="Seznam uživatelů"
        >
          <div className="admin-users-row admin-users-head" role="row">
            <span>Uživatel</span>
            <span>E-mail</span>
            <span>Tarif</span>
            <span>Role</span>
            <span>Stav</span>
            <span>Akce</span>
          </div>

          {adminUsers.map((account) => (
            <div className="admin-users-row" role="row" key={account.id}>
              <strong>{account.username || "Bez jména"}</strong>

              <span>{account.email || "—"}</span>

              <span>
                {account.role === "admin" ? (
                  "—"
                ) : (
                  <div className="admin-plan-select-wrap">
                    <button
                      type="button"
                      className={`admin-plan-select ${
                        openPlanId === account.id ? "is-open" : ""
                      }`}
                      onClick={() =>
                        setOpenPlanId(
                          openPlanId === account.id ? null : account.id,
                        )
                      }
                    >
                      {getPlanLabel(
                        selectedPlans[account.id] ?? account.plan ?? "free",
                      )}
                    </button>

                    <ChevronDown
                      className="admin-plan-select-icon"
                      size={16}
                      strokeWidth={2}
                    />

                    {openPlanId === account.id && (
                      <div className="admin-plan-menu">
                        <button
                          type="button"
                          className="admin-plan-option"
                          onClick={() => handleSelectPlan(account.id, "free")}
                        >
                          Free
                        </button>

                        <button
                          type="button"
                          className="admin-plan-option"
                          onClick={() => handleSelectPlan(account.id, "mid")}
                        >
                          Mid
                        </button>

                        <button
                          type="button"
                          className="admin-plan-option"
                          onClick={() =>
                            handleSelectPlan(account.id, "enterprise")
                          }
                        >
                          Enterprise
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </span>

              <span>{account.role === "admin" ? "Admin" : "Uživatel"}</span>

              <span>
                {account.role === "admin"
                  ? "Schválen"
                  : account.approved
                    ? "Schválen"
                    : "Čeká na schválení"}
              </span>

              <span>
                {account.role === "admin" ? (
                  "—"
                ) : (
                  <button
                    type="button"
                    className="admin-approve-button"
                    onClick={() => {
                      const selectedPlan =
                        selectedPlans[account.id] ?? account.plan ?? "free";

                      if (account.approved) {
                        onPlanChange(account.id, selectedPlan);
                      } else {
                        onApproveUser(account.id, selectedPlan);
                      }
                    }}
                  >
                    {account.approved ? "Uložit" : "Schválit"}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminUsers;
