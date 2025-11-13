import React from "react";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d={d} />
  </svg>
);

export const FIELD_TEMPLATES = [
  {
    key: "shortText",
    label: "Text",
    desc: "Titles, names, tags",
    icon: () => <Icon d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" />,
    config: { mode: "short" },
  },
  {
    key: "richText",
    label: "Rich text",
    desc: "Formatted text",
    icon: () => <Icon d="M4 5h16v2H4zM4 9h10v2H4zM4 13h16v2H4zM4 17h10v2H4z" />,
    config: { mode: "long" },
  },
  {
    key: "number",
    label: "Number",
    desc: "Integer/decimal",
    icon: () => (
      <Icon d="M7 3h2l-.5 3H10l.5-3h2l-.5 3h3l.5-3h2l-.5 3H20v2h-2.5l-1 6H20v2h-2.5l-.5 3h-2l.5-3h-3l-.5 3h-2l.5-3H4v-2h2.5l1-6H4V6h2.5l.5-3z" />
    ),
    config: { variant: "integer", validations: {} },
  },
  {
    key: "media",
    label: "Media",
    desc: "Images / files",
    icon: () => (
      <Icon d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2z" />
    ),
    config: { many: false },
  },
  {
    key: "reference",
    label: "Reference",
    desc: "Link entries",
    icon: () => (
      <Icon d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 1 0 0 6h3v2h-3a5 5 0 0 1-5-5zm6-1h4v2h-4v-2zm5.1-4h3a5 5 0 1 1 0 10h-3v-2h3a3 3 0 1 0 0-6h-3V7z" />
    ),
    config: { multiple: false },
  },
  {
    key: "datetime",
    label: "Date & time",
    desc: "Event dates",
    icon: () => <Icon d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm12 6H5v12h14V8z" />,
    config: { withTime: true },
  },
  {
    key: "boolean",
    label: "Boolean",
    desc: "Yes/No",
    icon: () => <Icon d="M9 16.17 4.83 12 3.41 13.41 9 19l12-12-1.41-1.41z" />,
    config: {},
  },
  {
    key: "json",
    label: "JSON object",
    desc: "Arbitrary JSON",
    icon: () => (
      <Icon d="M7 7h2v2H7V7zm8 0h2v2h-2V7zM5 11h14v2H5v-2zm2 4h2v2H7v-2zm8 0h2v2h-2v-2z" />
    ),
    config: {},
  },
];
