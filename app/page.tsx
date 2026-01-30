"use client";

import { useState } from "react";
import { StockCount } from "@/components/stock-count";
import { AnalystPanel } from "@/components/analyst-panel";
import { Button } from "@/components/ui/button";
import { Package, BarChart3 } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"conferente" | "analista">("conferente");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-center gap-2">
            <Button
              variant={activeTab === "conferente" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("conferente")}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Conferente
            </Button>
            <Button
              variant={activeTab === "analista" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("analista")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analista
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeTab === "conferente" ? <StockCount /> : <AnalystPanel />}
    </div>
  );
}
