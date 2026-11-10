"use client";

import { CHECKS, sharedDisplay, type CaseForm, type CheckKey, type IntlCasePayload } from "@/lib/intlcase/contract";

/** The submit preview: every answer labelled with the question id that carries it. */
export function ReviewBody({
  form,
  payload,
  onEdit,
}: {
  form: CaseForm;
  payload: IntlCasePayload;
  onEdit: (step: CheckKey | "candidate") => void;
}) {
  return (
    <div className="mf-step-b">
      <p className="ma-lede">This is the case we register. Each answer is stored under its question id.</p>
      <section className="mf-rev-s">
        <div className="mf-rev-h">
          <h3>You</h3>
          <button type="button" className="mf-rev-edit" onClick={() => onEdit("candidate")}>
            Edit
          </button>
        </div>
        <dl className="mf-rev-dl">
          <div>
            <dt>Name</dt>
            <dd>
              {form.shared.firstName} {form.shared.lastName}
            </dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{sharedDisplay(form, "dateOfBirth")}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{form.shared.gender}</dd>
          </div>
          <div className="mf-rev-wide">
            <dt>Father's name / mother's name</dt>
            <dd>{form.shared.parentName}</dd>
          </div>
        </dl>
      </section>
      {payload.checks.map((item) => {
        const def = CHECKS[item.key];
        return (
          <section key={item.key} className="mf-rev-s">
            <div className="mf-rev-h">
              <h3>
                {def.title} · {def.code}
              </h3>
              <button type="button" className="mf-rev-edit" onClick={() => onEdit(item.key)}>
                Edit
              </button>
            </div>
            <p className="ix-meta">
              Master {def.masterId} · group {def.questionGroupId}
            </p>
            <dl className="mf-rev-dl">
              {Object.entries(item.answers).map(([id, value]) => {
                const q = def.questions.find((question) => String(question.id) === id);
                return (
                  <div key={id}>
                    <dt>
                      {id} · {q?.name ?? "Answer"}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                );
              })}
              {item.documents.map((doc) => (
                <div key={doc.documentTypeId}>
                  <dt>File {doc.documentTypeId}</dt>
                  <dd>{doc.fileName}</dd>
                </div>
              ))}
              {item.documents.length === 0 ? (
                <div>
                  <dt>File</dt>
                  <dd>None</dd>
                </div>
              ) : null}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
