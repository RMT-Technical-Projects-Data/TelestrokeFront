import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";

const UserProfileBadge = ({ compact = false, onSignOutRequest }) => {
  const navigate = useNavigate();
  const [showSignOut, setShowSignOut] = useState(false);
  const displayName = localStorage.getItem("Doctor") || "User";
  const role = localStorage.getItem("role") || "user";
  const roleLabel = role === "admin" ? "Administrator" : "Clinician";

  const confirmSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("Doctor");
    localStorage.removeItem("role");
    sessionStorage.removeItem("tsOverdueToastShown");
    toast.dismiss();
    setShowSignOut(false);
    navigate("/login");
  };

  return (
    <div className="ts-rail-profile">
      <div
        className="flex items-center gap-2.5"
        title={`${displayName} (${roleLabel})`}
      >
        <div className="ts-avatar">
          <CircleUserRound size={18} />
        </div>
        <div className="ts-profile-text min-w-0 flex-1 text-left leading-tight">
          <div className="truncate text-sm font-semibold">{displayName}</div>
          <div className="truncate text-[11px] font-semibold" style={{ color: "#94a3b8" }}>
            {roleLabel}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => (onSignOutRequest ? onSignOutRequest() : setShowSignOut(true))}
        className="ts-btn ts-btn-ghost ts-signout-btn w-full"
        title="Sign Out"
      >
        <LogOut size={15} />
        {!compact ? <span className="ts-profile-text">Sign Out</span> : null}
      </button>
      <ConfirmModal
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={confirmSignOut}
        title="Sign out?"
        message="You will be signed out of this session and returned to the login screen."
        confirmLabel="Sign Out"
        danger
        icon="logout"
      />
    </div>
  );
};

export default UserProfileBadge;
