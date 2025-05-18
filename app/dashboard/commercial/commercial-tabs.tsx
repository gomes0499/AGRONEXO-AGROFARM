"use client";

import * as React from "react";

interface CommercialTabsProps {
  seedsTab: React.ReactNode;
  livestockTab: React.ReactNode;
}

export class CommercialTabs extends React.Component<
  CommercialTabsProps,
  { activeTab: string }
> {
  constructor(props: CommercialTabsProps) {
    super(props);
    this.state = {
      activeTab: "seeds",
    };
  }

  setActiveTab = (tab: string) => {
    this.setState({ activeTab: tab });
  };

  render() {
    const { seedsTab, livestockTab } = this.props;
    const { activeTab } = this.state;

    return (
      <div className="space-y-4">
        {/* Barra de navegação simples */}
        <div className="flex rounded-lg bg-muted p-1 mb-4">
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "seeds"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => this.setActiveTab("seeds")}
          >
            Sementes
          </button>
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "livestock"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => this.setActiveTab("livestock")}
          >
            Pecuária
          </button>
        </div>

        {/* Conteúdo da tab */}
        <div className="tab-content">
          <div style={{ display: activeTab === "seeds" ? "block" : "none" }}>
            {seedsTab}
          </div>
          <div
            style={{ display: activeTab === "livestock" ? "block" : "none" }}
          >
            {livestockTab}
          </div>
        </div>
      </div>
    );
  }
}
