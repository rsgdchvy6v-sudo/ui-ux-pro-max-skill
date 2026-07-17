"use client";

import { InteractionBundle } from "@/app/interactions/[id]/page";

export default function CustomerHeader({ bundle }: { bundle: InteractionBundle }) {
  const { customer } = bundle;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
            {customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-stone-900">{customer.name}</h2>
              {customer.flags.map((f) => (
                <span key={f} className="pill bg-violet-100 text-violet-700">
                  {f}
                </span>
              ))}
              <span className="pill bg-stone-100 text-stone-600">{customer.segment}</span>
            </div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>
                Emirates ID: <span className="font-mono">{customer.emiratesId}</span>
              </span>
              {customer.uid && (
                <span>
                  UID: <span className="font-mono">{customer.uid}</span>
                </span>
              )}
              <span>Phone: {customer.phone}</span>
              <span>Email: {customer.email}</span>
              <span>Language: {customer.language}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
