"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SortDir = "asc" | "desc";

export interface SortRule<K extends string> {
  key: K;
  dir: SortDir;
}

const BLANK_LABEL = "(빈 값)";

function FilterGlyph({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 ${active ? "text-[#004b87]" : "text-slate-400"}`}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M1.2 1.5h9.6L7.2 6.1v3.4L4.8 11V6.1z"
      />
    </svg>
  );
}

export function ExcelColumnTh<K extends string>({
  label,
  columnKey,
  optionValues,
  selectedValues,
  sorts,
  open,
  onToggleOpen,
  onSort,
  onApplyFilter,
  onClearFilter,
}: {
  label: string;
  columnKey: K;
  optionValues: string[];
  selectedValues: Set<string> | null;
  sorts: SortRule<K>[];
  open: boolean;
  onToggleOpen: (key: K) => void;
  onSort: (key: K, dir: SortDir | "clear") => void;
  onApplyFilter: (key: K, selected: Set<string> | null) => void;
  onClearFilter: (key: K) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const sortIndex = sorts.findIndex((rule) => rule.key === columnKey);
  const sortRule = sortIndex >= 0 ? sorts[sortIndex] : null;
  const filtered = selectedValues != null;

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optionValues;
    return optionValues.filter((value) => {
      const text = value === "" ? BLANK_LABEL : value;
      return text.toLowerCase().includes(q);
    });
  }, [optionValues, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDraft(
      selectedValues
        ? new Set(selectedValues)
        : new Set(optionValues),
    );
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 264;
      const height = 420;
      const top =
        rect.bottom + 4 + height > window.innerHeight
          ? Math.max(8, rect.top - height - 4)
          : rect.bottom + 4;
      setCoords({
        top,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
    // Initialize only when the menu opens so parent re-renders do not reset search/draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open-only init
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onToggleOpen(columnKey);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onToggleOpen(columnKey);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, columnKey, onToggleOpen]);

  const allVisibleChecked =
    visibleOptions.length > 0 &&
    visibleOptions.every((value) => draft.has(value));

  function toggleAllVisible() {
    setDraft((prev) => {
      const next = new Set(prev);
      if (allVisibleChecked) {
        for (const value of visibleOptions) next.delete(value);
      } else {
        for (const value of visibleOptions) next.add(value);
      }
      return next;
    });
  }

  function apply() {
    if (draft.size === 0) {
      onApplyFilter(columnKey, new Set());
      return;
    }
    if (draft.size === optionValues.length) {
      onApplyFilter(columnKey, null);
      return;
    }
    onApplyFilter(columnKey, new Set(draft));
  }

  return (
    <th className="relative whitespace-nowrap px-1 py-1 font-medium">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onToggleOpen(columnKey)}
        className={`flex w-full min-w-0 items-center gap-0.5 rounded px-0.5 py-1 text-left hover:bg-slate-200/70 ${
          filtered || sortRule ? "text-[#004b87]" : ""
        }`}
        title="정렬 및 필터"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {sortRule ? (
          <span className="shrink-0 text-[10px] leading-none">
            {sortRule.dir === "asc" ? "▲" : "▼"}
            {sorts.length > 1 ? (
              <span className="ml-px text-[9px]">{sortIndex + 1}</span>
            ) : null}
          </span>
        ) : null}
        <span className="print:hidden">
          <FilterGlyph active={filtered} />
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label={`${label} 정렬 및 필터`}
              className="fixed z-[70] w-[264px] rounded-lg border border-slate-200 bg-white py-2 shadow-[0_12px_40px_rgba(15,38,69,0.18)]"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="px-2">
                <button
                  type="button"
                  className={`flex w-full items-center rounded px-2 py-1.5 text-left text-[12px] hover:bg-slate-50 ${
                    sortRule?.dir === "asc" ? "font-medium text-[#004b87]" : "text-slate-700"
                  }`}
                  onClick={() => onSort(columnKey, "asc")}
                >
                  오름차순 정렬
                </button>
                <button
                  type="button"
                  className={`flex w-full items-center rounded px-2 py-1.5 text-left text-[12px] hover:bg-slate-50 ${
                    sortRule?.dir === "desc" ? "font-medium text-[#004b87]" : "text-slate-700"
                  }`}
                  onClick={() => onSort(columnKey, "desc")}
                >
                  내림차순 정렬
                </button>
                {sortRule ? (
                  <button
                    type="button"
                    className="flex w-full items-center rounded px-2 py-1.5 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                    onClick={() => onSort(columnKey, "clear")}
                  >
                    정렬 해제
                  </button>
                ) : null}
              </div>
              <div className="my-2 border-t border-slate-100" />
              <div className="px-2">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="검색"
                  className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-[12px] outline-none focus:border-[#009ada]"
                />
                <div className="max-h-48 overflow-auto rounded-md border border-slate-100">
                  <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={allVisibleChecked}
                      onChange={toggleAllVisible}
                    />
                    (전체 선택)
                  </label>
                  {visibleOptions.map((value) => {
                    const id = `${columnKey}-${value || "__blank"}`;
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={draft.has(value)}
                          onChange={() => {
                            setDraft((prev) => {
                              const next = new Set(prev);
                              if (next.has(value)) next.delete(value);
                              else next.add(value);
                              return next;
                            });
                          }}
                        />
                        <span className="min-w-0 truncate">
                          {value === "" ? BLANK_LABEL : value}
                        </span>
                      </label>
                    );
                  })}
                  {visibleOptions.length === 0 ? (
                    <p className="px-2 py-2 text-[12px] text-slate-400">
                      검색 결과가 없습니다.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 px-2 pt-2">
                {filtered ? (
                  <button
                    type="button"
                    className="mr-auto rounded px-2 py-1 text-[12px] text-slate-500 hover:bg-slate-50"
                    onClick={() => onClearFilter(columnKey)}
                  >
                    필터 해제
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2.5 py-1 text-[12px] text-slate-600 hover:bg-slate-50"
                  onClick={() => onToggleOpen(columnKey)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="rounded bg-[#004b87] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[#003a6b]"
                  onClick={apply}
                >
                  확인
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </th>
  );
}
