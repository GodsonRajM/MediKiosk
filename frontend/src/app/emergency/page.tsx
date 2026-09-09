"use client";

import React, { Suspense } from "react";
import PublicEmergencyClient from "./[token]/EmergencyClient";

function EmergencyContent() {
  return <PublicEmergencyClient />;
}

export default function EmergencyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Emergency Gateway...</div>}>
      <EmergencyContent />
    </Suspense>
  );
}
