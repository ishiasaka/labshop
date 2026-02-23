import { useAuth } from "../context/AuthContext";
import { redirect } from "next/navigation";

const SecureWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) redirect("/admin/login");
    return <>{children}</>;
    }

export default SecureWrapper;