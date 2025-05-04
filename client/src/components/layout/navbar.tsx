import * as React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";
import { useToastService } from "@/components/shared/toast-service";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { showSuccess } = useToastService();

  const handleLogout = () => {
    clearToken();
    showSuccess("Logged out successfully");
    setLocation("/login");
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="w-10 h-10 mr-3"
            >
              <path 
                d="M3 21h18M3 10h18M3 3h18"
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xl font-semibold">Territory Assignment</span>
          </div>
          <div className="flex items-center space-x-4">
            <NavLink href="/" label="Home" />
            <NavLink href="/assign" label="Assign" />
            <NavLink href="/reassign" label="Reassign" />
            <Button 
              variant="outline" 
              className="ml-4 bg-white text-primary hover:bg-gray-100"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
}

function NavLink({ href, label }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a className={`py-2 px-3 hover:bg-primary-dark rounded transition-colors ${
        isActive ? "bg-primary-dark" : ""
      }`}>
        {label}
      </a>
    </Link>
  );
}
