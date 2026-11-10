"use client";

import { FieldError } from "@/components/momapply/PasswordField";
import { TextField } from "@/components/momapply/flow/Fields";
import { countryOptions } from "@/lib/intlcase/countries";
import {
  GENDER_OPTIONS,
  YES_NO,
  isShown,
  sharedDisplay,
  sharedNeeds,
  yearOptions,
  type CaseForm,
  type CheckKey,
  type QuestionDef,
} from "@/lib/intlcase/contract";

function Chevron() {
  return (
    <svg className="mf-chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
      <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CandidateForm({
  form,
  keys,
  errors,
  onChange,
}: {
  form: CaseForm;
  keys: readonly CheckKey[];
  errors: Record<string, string>;
  onChange: (next: CaseForm["shared"]) => void;
}) {
  const s = form.shared;
  const needs = sharedNeeds(keys);
  const set = (patch: Partial<CaseForm["shared"]>) => onChange({ ...s, ...patch });
  return (
    <div className="mf-step-b">
      <p className="ma-lede">Enter these once. Each selected check that asks for them receives the same answers.</p>
      {needs.name ? (
        <div className="ma-row2">
          <TextField id="ix-first" label="First name *" autoComplete="given-name" value={s.firstName} error={errors["shared.firstName"]} onChange={(firstName) => set({ firstName })} />
          <TextField id="ix-last" label="Last name *" autoComplete="family-name" value={s.lastName} error={errors["shared.lastName"]} onChange={(lastName) => set({ lastName })} />
        </div>
      ) : null}
      {needs.dateOfBirth ? (
        <TextField id="ix-dob" label="Date of birth *" type="date" autoComplete="bday" value={s.dateOfBirth} error={errors["shared.dateOfBirth"]} onChange={(dateOfBirth) => set({ dateOfBirth })} />
      ) : null}
      {needs.gender ? (
        <fieldset className="mf-set ma-field">
          <legend className="ma-l">Gender *</legend>
          <div className={`mf-pills${errors["shared.gender"] ? " is-bad" : ""}`}>
            {GENDER_OPTIONS.map((opt) => (
              <label key={opt} className={s.gender === opt ? "is-on" : undefined}>
                <input type="radio" name="ix-gender" value={opt} checked={s.gender === opt} onChange={() => set({ gender: opt })} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {errors["shared.gender"] ? <FieldError id="ix-gender-err">{errors["shared.gender"]}</FieldError> : null}
        </fieldset>
      ) : null}
      {needs.parentName ? (
        <TextField
          id="ix-parent"
          label="Father's name / mother's name *"
          autoComplete="additional-name"
          value={s.parentName}
          error={errors["shared.parentName"]}
          onChange={(parentName) => set({ parentName })}
        />
      ) : null}
    </div>
  );
}

function Locked({ q, value, onEdit }: { q: QuestionDef; value: string; onEdit?: () => void }) {
  const fid = `ix-q-${q.id}`;
  return (
    <div className="ma-field" data-question-id={q.id}>
      <div className="ma-lrow">
        <label className="ma-l" htmlFor={fid}>
          {q.name}
        </label>
        {onEdit ? (
          <button type="button" className="ma-link ma-link-sm" onClick={onEdit}>
            Edit
          </button>
        ) : null}
      </div>
      <div className="ma-ctl is-locked">
        <input id={fid} readOnly value={value} />
      </div>
    </div>
  );
}

function SearchField({ q, value, error, onChange }: { q: QuestionDef; value: string; error?: string; onChange: (value: string) => void }) {
  const fid = `ix-q-${q.id}`;
  const directory = q.control.kind === "search" ? q.control.directory : "name";
  return (
    <div className="ma-field" data-question-id={q.id}>
      <label className="ma-l" htmlFor={fid}>
        {q.name} *
      </label>
      <div className={`ma-ctl${error ? " is-bad" : ""}`}>
        <input
          id={fid}
          value={value}
          placeholder={q.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : `${fid}-hint`}
          autoComplete="organization"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="mf-hint" id={`${fid}-hint`}>
        Type the official {directory} name. This is the text that gets sent.
      </p>
      {error ? <FieldError id={`${fid}-err`}>{error}</FieldError> : null}
    </div>
  );
}

export function QuestionField({
  q,
  form,
  value,
  error,
  onAnswer,
  onEditShared,
}: {
  q: QuestionDef;
  form: CaseForm;
  value: string;
  error?: string;
  onAnswer: (id: number, value: string) => void;
  onEditShared: () => void;
}) {
  const fid = `ix-q-${q.id}`;
  if (q.fromShared) {
    const shown = q.fromShared === "dateOfBirth" ? form.shared.dateOfBirth : sharedDisplay(form, q.fromShared);
    if (q.fromShared === "dateOfBirth") {
      return (
        <div className="ma-field" data-question-id={q.id}>
          <div className="ma-lrow">
            <label className="ma-l" htmlFor={fid}>
              {q.name}
            </label>
            <button type="button" className="ma-link ma-link-sm" onClick={onEditShared}>
              Edit
            </button>
          </div>
          <div className="ma-ctl is-locked">
            <input id={fid} type="date" readOnly value={shown} />
          </div>
        </div>
      );
    }
    return <Locked q={q} value={sharedDisplay(form, q.fromShared)} onEdit={onEditShared} />;
  }
  if (q.control.kind === "search") return <SearchField q={q} value={value} error={error} onChange={(v) => onAnswer(q.id, v)} />;
  if (q.control.kind === "yesNo" || (q.control.kind === "select" && q.control.options === GENDER_OPTIONS && !q.fromShared)) {
    const options = q.control.kind === "yesNo" ? YES_NO : q.control.kind === "select" ? q.control.options : [];
    return (
      <fieldset className="mf-set ma-field" data-question-id={q.id}>
        <legend className="ma-l">
          {q.name}
          {q.required ? " *" : ""}
        </legend>
        <div className={`mf-pills${error ? " is-bad" : ""}`}>
          {options.map((opt) => (
            <label key={opt} className={value === opt ? "is-on" : undefined}>
              <input type="radio" name={fid} value={opt} checked={value === opt} onChange={() => onAnswer(q.id, opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {error ? <FieldError id={`${fid}-err`}>{error}</FieldError> : null}
      </fieldset>
    );
  }
  if (q.control.kind === "checkbox") {
    return (
      <label className="ma-check" data-question-id={q.id}>
        <input type="checkbox" checked={value === "Yes"} onChange={(e) => onAnswer(q.id, e.target.checked ? "Yes" : "")} />
        <span>{q.name}</span>
      </label>
    );
  }
  if (q.control.kind === "select" || q.control.kind === "country" || q.control.kind === "year") {
    const options =
      q.control.kind === "year" ? yearOptions() : q.control.kind === "country" ? countryOptions(q.control.format) : q.control.options;
    return (
      <div className="ma-field" data-question-id={q.id}>
        <div className="ma-lrow">
          <label className="ma-l" htmlFor={fid}>
            {q.name}
            {q.required ? " *" : ""}
          </label>
          {q.required ? null : <span className="mf-opt">Optional</span>}
        </div>
        <div className={`ma-ctl mf-sel${error ? " is-bad" : ""}`}>
          <select
            id={fid}
            value={value}
            className={value ? undefined : "is-empty"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fid}-err` : undefined}
            onChange={(e) => onAnswer(q.id, e.target.value)}
          >
            <option value="">{q.required ? "Choose" : "Not specified"}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        {q.hint ? <p className="mf-hint">{q.hint}</p> : null}
        {error ? <FieldError id={`${fid}-err`}>{error}</FieldError> : null}
      </div>
    );
  }
  if (q.control.kind === "date" || q.control.kind === "monthYear") {
    return (
      <div data-question-id={q.id}>
        <TextField
          id={fid}
          label={`${q.name}${q.required ? " *" : ""}`}
          type={q.control.kind === "date" ? "date" : "month"}
          value={value}
          error={error}
          onChange={(v) => onAnswer(q.id, v)}
        />
      </div>
    );
  }
  return (
    <div data-question-id={q.id}>
      <TextField
        id={fid}
        label={`${q.name}${q.required ? " *" : ""}`}
        optional={q.required ? undefined : "Optional"}
        type={q.control.kind === "text" && q.control.input === "email" ? "email" : q.control.kind === "text" && q.control.input === "tel" ? "tel" : "text"}
        inputMode={q.control.kind === "text" && q.control.input === "tel" ? "tel" : undefined}
        autoCapitalize={q.control.kind === "text" && q.control.caps ? "characters" : undefined}
        spellCheck={q.control.kind === "text" && q.control.caps ? false : undefined}
        placeholder={q.placeholder}
        hint={q.hint}
        value={value}
        error={error}
        onChange={(v) => onAnswer(q.id, v)}
      />
    </div>
  );
}

export function questionBlocks(questions: readonly QuestionDef[], answers: Record<string, string>) {
  const visible = questions.filter((q) => isShown(q, answers));
  const out: Array<{ heading?: string; items: QuestionDef[] }> = [];
  for (let i = 0; i < visible.length; i++) {
    const q = visible[i];
    const next = visible[i + 1];
    const heading = q.group && q.group !== visible[i - 1]?.group ? q.group : undefined;
    if (q.half && next?.half && next.group === q.group) {
      out.push({ heading, items: [q, next] });
      i += 1;
    } else out.push({ heading, items: [q] });
  }
  return out;
}
