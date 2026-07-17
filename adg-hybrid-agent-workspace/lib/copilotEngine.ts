// Local, rule-based "AI Copilot" — no external calls.
import { CoreApplication, Interaction } from "./types";
import { CustomerView, TimelineEventView } from "./view";

export interface CopilotOutput {
  summary: string[];
  eligibility: { isEligible: boolean; reasons: string[] };
  pending: { missingDocs: string[]; invalidDocs: string[]; waivedDocs: string[]; pendingSteps: string[] };
  nextSteps: string[];
  generatedAt: string;
}

export function generateCopilotOutput(params: {
  customer: CustomerView;
  interaction: Interaction;
  coreApp?: CoreApplication;
  recentEvents: TimelineEventView[];
}): CopilotOutput {
  const { customer, interaction, coreApp, recentEvents } = params;

  const summary: string[] = [];
  summary.push(
    `${customer.name} (${customer.segment}${customer.flags.length ? `, ${customer.flags.join(", ")}` : ""}) is here for "${interaction.serviceName}" via ${interaction.mode === "PHYSICAL" ? "a physical visit" : "a virtual session"}.`
  );
  summary.push(`Interaction ${interaction.interactionId} is currently ${interaction.status.replace("_", " ")} with ${interaction.priority} priority.`);

  const complaintEvents = recentEvents.filter((e) => e.type === "COMPLAINT");
  if (complaintEvents.length) {
    const resolved = complaintEvents.filter((e) => e.title.toLowerCase().includes("resolved"));
    summary.push(
      `${complaintEvents.length} prior complaint(s) on file${resolved.length ? `, ${resolved.length} resolved` : ""}.`
    );
  }

  if (coreApp) {
    summary.push(
      coreApp.eligibility.isEligible
        ? `Core application "${coreApp.serviceName}" is currently eligible to proceed.`
        : `Core application "${coreApp.serviceName}" is NOT eligible: ${coreApp.eligibility.reasons.join("; ")}.`
    );
  }

  if (interaction.mode === "VIRTUAL" && interaction.appointment?.virtualJoinUrl) {
    summary.push("A virtual join link is available in Session Controls.");
  }

  const eligibility = coreApp
    ? {
        isEligible: coreApp.eligibility.isEligible,
        reasons: coreApp.eligibility.exceptionGranted
          ? [...coreApp.eligibility.reasons, `Exception granted: ${coreApp.eligibility.exceptionNote ?? ""}`.trim()]
          : coreApp.eligibility.reasons,
      }
    : { isEligible: true, reasons: [] };

  const missingDocs = coreApp?.requiredDocs.filter((d) => d.status === "MISSING" && !d.waived).map((d) => d.name) ?? [];
  const invalidDocs = coreApp?.requiredDocs.filter((d) => d.status === "INVALID" && !d.waived).map((d) => d.name) ?? [];
  const waivedDocs = coreApp?.requiredDocs.filter((d) => d.waived).map((d) => d.name) ?? [];
  const pendingSteps = coreApp?.pendingSteps ?? [];

  const nextSteps: string[] = [];
  if (interaction.status === "ARRIVED") nextSteps.push("Call the customer's token to a counter to begin service.");
  if (interaction.status === "CALLED") nextSteps.push("Start the service session once the customer is at the counter.");
  if (missingDocs.length) nextSteps.push(`Collect missing document(s): ${missingDocs.join(", ")} — or request a waiver.`);
  if (invalidDocs.length) nextSteps.push(`Resolve invalid document(s): ${invalidDocs.join(", ")}.`);
  if (coreApp && !coreApp.eligibility.isEligible && !coreApp.eligibility.exceptionGranted) {
    nextSteps.push("Customer is not currently eligible — consider requesting an Eligibility Exception if warranted.");
  }
  if (pendingSteps.length) nextSteps.push(...pendingSteps.map((s) => `Complete step: ${s}`));
  if (interaction.status === "IN_SERVICE" && !missingDocs.length && !invalidDocs.length && (!coreApp || coreApp.eligibility.isEligible)) {
    nextSteps.push("All requirements satisfied — proceed to close out the interaction.");
  }
  if (nextSteps.length === 0) nextSteps.push("No further action required right now.");

  return {
    summary,
    eligibility,
    pending: { missingDocs, invalidDocs, waivedDocs, pendingSteps },
    nextSteps,
    generatedAt: new Date().toISOString(),
  };
}
