
"use client";

import { useMemo, useState } from "react";

type Member = {
  id: number;
  name: string;
  code: string;
};

export default function MemberSearchSelect({
  members,
}: {
  members: Member[];
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.code.toLowerCase().includes(query)
    );
  }, [members, search]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedId("");
        }}
        placeholder="Search member by name or ID..."
        className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-link"
      />

      <select
        name="memberId"
        required
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-link"
      >
        <option value="" disabled>
          {filteredMembers.length > 0
            ? "Select member"
            : "No matching members found"}
        </option>

        {filteredMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} ({member.code})
          </option>
        ))}
      </select>
    </div>
  );
}
