"use client";

import { useId, useState } from "react";

import { FieldError } from "@/components/momapply/PasswordField";
import { FileIcon, TickIcon } from "@/components/momapply/icons";
import { QuestionField, questionBlocks } from "@/components/intlcase/fields";
import {
  CHECKS,
  FILE_ACCEPT,
  FILE_MAX_BYTES,
  FILE_TYPES,
  type CaseFile,
  type CaseForm,
  type CheckKey,
} from "@/lib/intlcase/contract";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

/** One check: what to upload, then the questions for that check's master id. */
export function CheckForm({
  checkKey,
  form,
  errors,
  onAnswer,
  onFile,
  onRemove,
  onEditShared,
}: {
  checkKey: CheckKey;
  form: CaseForm;
  errors: Record<string, string>;
  onAnswer: (id: number, value: string) => void;
  onFile: (file: CaseFile) => void;
  onRemove: (typeId: number) => void;
  onEditShared: () => void;
}) {
  const check = CHECKS[checkKey];
  const answers = form.answers[checkKey] ?? {};
  const files = form.files[checkKey] ?? {};
  const [local, setLocal] = useState<Record<string, string>>({});
  const reactId = useId();

  async function pick(typeId: number, name: string, file: File | null) {
    if (!file) return;
    const key = String(typeId);
    if (file.size > FILE_MAX_BYTES) {
      setLocal((prev) => ({ ...prev, [key]: `${name} is over 2 MB.` }));
      return;
    }
    const typeOk = /^(application\/pdf|image\/jpeg|image\/png|image\/webp)$/.test(file.type) || /\.(pdf|png|jpe?g|webp)$/i.test(file.name);
    if (!typeOk) {
      setLocal((prev) => ({ ...prev, [key]: "Use a PDF, JPG or PNG." }));
      return;
    }
    try {
      const dataUrl = await readFile(file);
      setLocal((prev) => ({ ...prev, [key]: "" }));
      onFile({ documentTypeId: typeId, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size, dataUrl });
    } catch {
      setLocal((prev) => ({ ...prev, [key]: "That file could not be read." }));
    }
  }

  return (
    <div className="mf-step-b">
      <p className="ma-lede">{check.lede}</p>
      <p className="ix-meta">
        Check master {check.masterId} · code {check.code} · group {check.questionGroupId} {check.questionGroupCode}
      </p>

      {check.noFile ? (
        <div className="ix-how">
          <p className="ma-l">What to upload</p>
          <p>{check.noFile}</p>
        </div>
      ) : (
        <div className="mf-docs">
          <p className="ma-l">What to upload</p>
          {check.documents.map((doc) => {
            const file = files[String(doc.typeId)];
            const error = local[String(doc.typeId)] || errors[`${checkKey}.doc.${doc.typeId}`];
            return (
              <div key={doc.typeId} className="mf-doc-w" data-document-type-id={doc.typeId}>
                <div className="ix-slot">
                  <label className={`mf-doc ix-doc${file ? " is-done" : ""}${error ? " is-bad" : ""}`}>
                    <span className="mf-doc-ic">{file ? <TickIcon /> : <FileIcon />}</span>
                    <span className="mf-doc-b">
                      <span className="mf-doc-t">
                        {doc.name}
                        {doc.required ? " *" : ""}
                      </span>
                      <span className="mf-doc-m">{file ? file.fileName : doc.what}</span>
                      <span className="ix-meta">
                        Document type {doc.typeId} · {FILE_TYPES}
                      </span>
                    </span>
                    <input
                      className="ix-file"
                      type="file"
                      accept={FILE_ACCEPT}
                      aria-label={doc.name}
                      onChange={(e) => {
                        void pick(doc.typeId, doc.name, e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {file ? (
                    <button type="button" className="ma-link" onClick={() => onRemove(doc.typeId)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                {error ? <FieldError id={`${reactId}-${doc.typeId}`}>{error}</FieldError> : null}
              </div>
            );
          })}
        </div>
      )}

      {questionBlocks(check.questions, answers).map((block) => (
        <div key={block.items.map((q) => q.id).join("-")}>
          {block.heading ? <h3 className="ix-group">{block.heading}</h3> : null}
          {block.items.length === 2 ? (
            <div className="ma-row2">
              {block.items.map((q) => (
                <QuestionField key={q.id} q={q} form={form} value={answers[String(q.id)] ?? ""} error={errors[`${checkKey}.q.${q.id}`]} onAnswer={onAnswer} onEditShared={onEditShared} />
              ))}
            </div>
          ) : (
            <QuestionField q={block.items[0]} form={form} value={answers[String(block.items[0].id)] ?? ""} error={errors[`${checkKey}.q.${block.items[0].id}`]} onAnswer={onAnswer} onEditShared={onEditShared} />
          )}
        </div>
      ))}
    </div>
  );
}
