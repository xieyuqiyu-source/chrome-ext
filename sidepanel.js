document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "notes";
    const elements = {
        toggleComposer: document.getElementById("toggleComposer"),
        composerCard: document.getElementById("composerCard"),
        noteInput: document.getElementById("noteInput"),
        saveNote: document.getElementById("saveNote"),
        cancelComposer: document.getElementById("cancelComposer"),
        importNotes: document.getElementById("importNotes"),
        exportNotes: document.getElementById("exportNotes"),
        clearAllNotes: document.getElementById("clearAllNotes"),
        searchInput: document.getElementById("searchInput"),
        notesList: document.getElementById("notesList"),
        totalNotesMetric: document.getElementById("totalNotesMetric"),
        charCountMetric: document.getElementById("charCountMetric"),
        activeDaysMetric: document.getElementById("activeDaysMetric"),
        streakMetric: document.getElementById("streakMetric"),
        lastUpdatedMetric: document.getElementById("lastUpdatedMetric"),
        storageMetric: document.getElementById("storageMetric"),
        longNotesMetric: document.getElementById("longNotesMetric"),
        activityGrid: document.getElementById("activityGrid"),
        status: document.getElementById("status"),
        importModal: document.getElementById("importModal"),
        closeImportModal: document.getElementById("closeImportModal"),
        importInput: document.getElementById("importInput"),
        mergeImportBtn: document.getElementById("mergeImportBtn"),
        replaceImportBtn: document.getElementById("replaceImportBtn"),
        noteModal: document.getElementById("noteModal"),
        closeModal: document.getElementById("closeModal"),
        modalTime: document.getElementById("modalTime"),
        modalBody: document.getElementById("modalBody"),
        editInput: document.getElementById("editInput"),
        editToggleBtn: document.getElementById("editToggleBtn"),
        saveEditBtn: document.getElementById("saveEditBtn"),
        cancelEditBtn: document.getElementById("cancelEditBtn"),
        deleteNoteBtn: document.getElementById("deleteNoteBtn")
    };

    const state = {
        notes: [],
        filter: "",
        activeNoteId: null,
        isEditingModal: false,
        toastTimer: null
    };

    function showToast(message, isError = false) {
        window.clearTimeout(state.toastTimer);
        elements.status.textContent = message;
        elements.status.classList.add("is-visible");
        elements.status.classList.toggle("is-error", isError);
        state.toastTimer = window.setTimeout(() => {
            elements.status.classList.remove("is-visible", "is-error");
        }, 2400);
    }

    function generateId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatDateTime(timestamp) {
        return new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(timestamp));
    }

    function formatRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60_000) return "刚刚";
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
        if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
        return formatDateTime(timestamp);
    }

    function formatCompactNumber(value) {
        if (value >= 10_000) {
            return `${(value / 10_000).toFixed(1)}w`;
        }
        return `${value}`;
    }

    function buildActivitySeries(notes, days = 48) {
        const dayMap = new Map();
        notes.forEach((note) => {
            const date = new Date(note.updatedAt);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            dayMap.set(key, (dayMap.get(key) || 0) + 1);
        });

        const series = [];
        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - offset);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            series.push(dayMap.get(key) || 0);
        }
        return series;
    }

    function calculateStreak(series) {
        let streak = 0;
        for (let index = series.length - 1; index >= 0; index -= 1) {
            if (series[index] > 0) {
                streak += 1;
            } else {
                break;
            }
        }
        return streak;
    }

    function renderActivityGrid(series) {
        elements.activityGrid.replaceChildren();
        const max = Math.max(...series, 1);

        series.forEach((count) => {
            const cell = document.createElement("span");
            cell.className = "activity-cell";
            let level = 0;

            if (count > 0) {
                const ratio = count / max;
                if (ratio >= 0.9) level = 4;
                else if (ratio >= 0.55) level = 3;
                else if (ratio >= 0.25) level = 2;
                else level = 1;
                cell.classList.add(`level-${level}`);
            }

            cell.title = count > 0 ? `${count} 条更新` : "无更新";
            elements.activityGrid.appendChild(cell);
        });
    }

    function renderDashboard(notes, visibleNotes) {
        const totalChars = notes.reduce((sum, note) => sum + note.content.length, 0);
        const avgLength = notes.length ? Math.round(totalChars / notes.length) : 0;
        const longNotes = notes.filter((note) => note.content.length >= 140).length;
        const series = buildActivitySeries(notes);
        const activeDays = series.filter((count) => count > 0).length;
        const streak = calculateStreak(series);
        const latest = notes[0];
        const estimatedBytes = new Blob([JSON.stringify(notes)]).size;

        elements.totalNotesMetric.textContent = `${notes.length}`;
        elements.charCountMetric.textContent = formatCompactNumber(totalChars);
        elements.activeDaysMetric.textContent = `${activeDays} / 48`;
        elements.streakMetric.textContent = `${streak} 天`;
        elements.lastUpdatedMetric.textContent = latest ? formatRelativeTime(latest.updatedAt) : "暂无";
        elements.storageMetric.textContent = `${(estimatedBytes / 1024).toFixed(1)} KB`;
        elements.longNotesMetric.textContent = `${longNotes} 条`;

        renderActivityGrid(series);
    }

    function normalizeNote(note) {
        const content = typeof note.content === "string" ? note.content.trim() : "";
        return {
            id: note.id || generateId(),
            content,
            createdAt: note.createdAt || note.timestamp || Date.now(),
            updatedAt: note.updatedAt || note.lastModified || note.timestamp || Date.now()
        };
    }

    function sortNotes(notes) {
        return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async function readNotes() {
        const stored = await chrome.storage.sync.get([STORAGE_KEY]);
        const notes = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
        return sortNotes(notes.map(normalizeNote).filter((note) => note.content));
    }

    async function persistNotes(notes) {
        const payload = notes.map((note) => ({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
        }));
        await chrome.storage.sync.set({ [STORAGE_KEY]: payload });
    }

    function parseExportDate(value) {
        if (!value) return null;
        const normalized = value.trim().replace(/\./g, "/").replace(/\s+/g, " ");
        const match = normalized.match(
            /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
        );
        if (!match) return null;

        const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
        const timestamp = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second)
        ).getTime();

        return Number.isNaN(timestamp) ? null : timestamp;
    }

    function parseImportedNotes(text) {
        const trimmed = text.trim();
        if (!trimmed) return [];

        const blocks = trimmed
            .split(/\n\s*-{10,}\s*\n/g)
            .map((block) => block.trim())
            .filter(Boolean);

        return blocks
            .map((block) => {
                const lines = block.split(/\r?\n/);
                let createdAt = null;
                let updatedAt = null;
                let contentStartIndex = 0;

                for (let index = 0; index < lines.length; index += 1) {
                    const line = lines[index].trim();
                    if (!line) {
                        contentStartIndex = index + 1;
                        break;
                    }
                    if (line.startsWith("# ")) continue;

                    const createdMatch = line.match(/^创建时间[:：]\s*(.+)$/);
                    if (createdMatch) {
                        createdAt = parseExportDate(createdMatch[1]);
                        continue;
                    }

                    const updatedMatch = line.match(/^更新时间[:：]\s*(.+)$/);
                    if (updatedMatch) {
                        updatedAt = parseExportDate(updatedMatch[1]);
                        continue;
                    }

                    contentStartIndex = index;
                    break;
                }

                const content = lines.slice(contentStartIndex).join("\n").trim();
                if (!content) return null;

                const created = createdAt || updatedAt || Date.now();
                const updated = updatedAt || created;

                return normalizeNote({
                    id: generateId(),
                    content,
                    createdAt: created,
                    updatedAt: updated
                });
            })
            .filter(Boolean);
    }

    function mergeImportedNotes(existingNotes, importedNotes) {
        const seen = new Set();
        const merged = [];

        [...existingNotes, ...importedNotes].forEach((note) => {
            const normalized = normalizeNote(note);
            const signature = `${normalized.content}\u0000${normalized.createdAt}\u0000${normalized.updatedAt}`;
            if (seen.has(signature)) return;
            seen.add(signature);
            merged.push(normalized);
        });

        return sortNotes(merged);
    }

    function openComposer() {
        elements.composerCard.classList.remove("is-hidden");
        elements.noteInput.focus();
    }

    function closeComposer() {
        elements.composerCard.classList.add("is-hidden");
        elements.noteInput.value = "";
    }

    function openImportModal() {
        elements.importModal.classList.add("is-open");
        elements.importModal.setAttribute("aria-hidden", "false");
        elements.importInput.focus();
    }

    function closeImportModal() {
        elements.importModal.classList.remove("is-open");
        elements.importModal.setAttribute("aria-hidden", "true");
        elements.importInput.value = "";
    }

    function openModal(noteId) {
        state.activeNoteId = noteId;
        state.isEditingModal = false;
        renderModal();
        elements.noteModal.classList.add("is-open");
        elements.noteModal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        elements.noteModal.classList.remove("is-open");
        elements.noteModal.setAttribute("aria-hidden", "true");
        elements.editInput.value = "";
        state.activeNoteId = null;
        state.isEditingModal = false;
    }

    function setModalEditing(isEditing) {
        state.isEditingModal = isEditing;
        elements.modalBody.classList.toggle("is-hidden", isEditing);
        elements.editInput.classList.toggle("is-hidden", !isEditing);
        elements.editToggleBtn.classList.toggle("is-hidden", isEditing);
        elements.saveEditBtn.classList.toggle("is-hidden", !isEditing);
        elements.cancelEditBtn.classList.toggle("is-hidden", !isEditing);
        if (isEditing) {
            elements.editInput.focus();
        }
    }

    function createLinkedContent(text) {
        const fragment = document.createDocumentFragment();
        const regex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const value = match[0];
            const link = document.createElement("a");
            link.textContent = value;
            link.href = value.startsWith("http") ? value : `https://${value}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            fragment.appendChild(link);
            lastIndex = match.index + value.length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        return fragment;
    }

    function fillMultilineContent(container, text) {
        container.replaceChildren();
        const lines = text.split("\n");
        lines.forEach((line, index) => {
            container.appendChild(createLinkedContent(line));
            if (index < lines.length - 1) {
                container.appendChild(document.createElement("br"));
            }
        });
    }

    function getFilteredNotes() {
        const keyword = state.filter.trim().toLowerCase();
        if (!keyword) return state.notes;
        return state.notes.filter((note) => note.content.toLowerCase().includes(keyword));
    }

    function renderEmptyState(isFiltered = false) {
        const wrapper = document.createElement("div");
        wrapper.className = "empty-state";
        wrapper.innerHTML = `
            <div class="empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 3.75A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25h12A2.25 2.25 0 0 0 20.25 18V8.56a2.25 2.25 0 0 0-.66-1.59l-2.56-2.56a2.25 2.25 0 0 0-1.6-.66H6Zm0 1.5h9.25v2.5c0 .97.78 1.75 1.75 1.75h2.5V18c0 .41-.34.75-.75.75H6a.75.75 0 0 1-.75-.75V6c0-.41.34-.75.75-.75Zm10.75 1.06 1.94 1.94H17a.25.25 0 0 1-.25-.25V6.31Z"/></svg>
            </div>
            <h3>${isFiltered ? "没有找到匹配内容" : "还没有任何笔记"}</h3>
            <p class="empty-copy">${isFiltered ? "换个关键词试试，或者清空搜索框查看全部笔记。" : "从一条短记录开始。内容会保存在当前 Chrome 账号的同步存储中。"}</p>
        `;
        elements.notesList.replaceChildren(wrapper);
    }

    function renderNotes() {
        const notes = getFilteredNotes();
        renderDashboard(state.notes, notes.length);

        if (!notes.length) {
            renderEmptyState(Boolean(state.filter.trim()));
            return;
        }

        const fragment = document.createDocumentFragment();
        notes.forEach((note) => {
            const card = document.createElement("article");
            card.className = "note-card";
            card.tabIndex = 0;
            card.dataset.id = note.id;

            const head = document.createElement("div");
            head.className = "note-head";

            const badge = document.createElement("span");
            badge.className = "badge badge-primary";
            badge.textContent = formatRelativeTime(note.updatedAt);

            const updated = document.createElement("span");
            updated.className = "note-meta";
            updated.textContent = note.updatedAt !== note.createdAt ? "已编辑" : "创建时间";

            head.append(badge, updated);

            const lines = note.content.trim().split("\n");
            const titleText = lines[0] || "无内容";
            const bodyText = lines.slice(1).join("\n").trim();

            const title = document.createElement("h3");
            title.className = "note-title";
            title.textContent = titleText;

            const preview = document.createElement("div");
            preview.className = "note-preview";
            if (bodyText) {
                fillMultilineContent(preview, bodyText);
            } else {
                preview.style.display = "none";
            }

            const footer = document.createElement("div");
            footer.className = "note-footer";

            const meta = document.createElement("span");
            meta.className = "note-meta";
            meta.textContent = `最近更新 ${formatDateTime(note.updatedAt)}`;

            const action = document.createElement("span");
            action.className = "badge";
            action.textContent = "查看详情";

            footer.append(meta, action);
            card.append(head, title, preview, footer);
            fragment.appendChild(card);
        });

        elements.notesList.replaceChildren(fragment);
    }

    function renderModal() {
        const note = state.notes.find((item) => item.id === state.activeNoteId);
        if (!note) {
            closeModal();
            return;
        }

        elements.modalTime.textContent = `创建于 ${formatDateTime(note.createdAt)} · 更新于 ${formatDateTime(note.updatedAt)}`;
        fillMultilineContent(elements.modalBody, note.content);
        elements.editInput.value = note.content;
        setModalEditing(state.isEditingModal);
    }

    async function refreshNotes() {
        try {
            state.notes = await readNotes();
            renderNotes();
            if (state.activeNoteId) {
                renderModal();
            }
        } catch (error) {
            showToast(`加载失败：${error.message}`, true);
        }
    }

    async function handleCreateNote() {
        const content = elements.noteInput.value.trim();
        if (!content) {
            showToast("请输入笔记内容", true);
            elements.noteInput.focus();
            return;
        }

        const now = Date.now();
        const note = {
            id: generateId(),
            content,
            createdAt: now,
            updatedAt: now
        };

        try {
            const nextNotes = sortNotes([note, ...state.notes]);
            await persistNotes(nextNotes);
            closeComposer();
            await refreshNotes();
            showToast("笔记已保存");
        } catch (error) {
            showToast(`保存失败：${error.message}`, true);
        }
    }

    async function handleSaveEdit() {
        const nextContent = elements.editInput.value.trim();
        if (!nextContent) {
            showToast("笔记内容不能为空", true);
            elements.editInput.focus();
            return;
        }

        const note = state.notes.find((item) => item.id === state.activeNoteId);
        if (!note) {
            showToast("当前笔记不存在", true);
            return;
        }

        try {
            const nextNotes = sortNotes(
                state.notes.map((item) =>
                    item.id === note.id
                        ? { ...item, content: nextContent, updatedAt: Date.now() }
                        : item
                )
            );
            await persistNotes(nextNotes);
            state.isEditingModal = false;
            await refreshNotes();
            showToast("笔记已更新");
        } catch (error) {
            showToast(`更新失败：${error.message}`, true);
        }
    }

    async function handleDeleteNote() {
        const note = state.notes.find((item) => item.id === state.activeNoteId);
        if (!note) return;
        if (!window.confirm("确定删除这条笔记？此操作不可恢复。")) return;

        try {
            const nextNotes = state.notes.filter((item) => item.id !== note.id);
            await persistNotes(nextNotes);
            closeModal();
            await refreshNotes();
            showToast("笔记已删除");
        } catch (error) {
            showToast(`删除失败：${error.message}`, true);
        }
    }

    async function handleClearAllNotes() {
        if (!state.notes.length) {
            showToast("当前没有可清空的笔记", true);
            return;
        }
        if (!window.confirm("确定清空全部笔记？此操作不可恢复。")) return;

        try {
            await persistNotes([]);
            closeModal();
            await refreshNotes();
            showToast("全部笔记已清空");
        } catch (error) {
            showToast(`清空失败：${error.message}`, true);
        }
    }

    async function handleExportNotes() {
        if (!state.notes.length) {
            showToast("没有可导出的笔记", true);
            return;
        }

        const exportText = state.notes
            .map((note, index) => {
                return [
                    `# 笔记 ${index + 1}`,
                    `创建时间：${formatDateTime(note.createdAt)}`,
                    `更新时间：${formatDateTime(note.updatedAt)}`,
                    "",
                    note.content
                ].join("\n");
            })
            .join("\n\n------------------------------\n\n");

        try {
            await navigator.clipboard.writeText(exportText);
            showToast(`已复制 ${state.notes.length} 条笔记到剪贴板`);
        } catch (error) {
            showToast(`导出失败：${error.message}`, true);
        }
    }

    async function handleImportNotes(mode) {
        const importedNotes = parseImportedNotes(elements.importInput.value);
        if (!importedNotes.length) {
            showToast("未识别到可恢复的笔记内容", true);
            elements.importInput.focus();
            return;
        }

        if (
            mode === "replace" &&
            state.notes.length &&
            !window.confirm("覆盖恢复会替换当前所有笔记，确定继续吗？")
        ) {
            return;
        }

        try {
            const nextNotes =
                mode === "replace"
                    ? sortNotes(importedNotes)
                    : mergeImportedNotes(state.notes, importedNotes);
            await persistNotes(nextNotes);
            closeImportModal();
            await refreshNotes();
            showToast(`已恢复 ${importedNotes.length} 条笔记`);
        } catch (error) {
            showToast(`恢复失败：${error.message}`, true);
        }
    }

    elements.toggleComposer.addEventListener("click", openComposer);
    elements.cancelComposer.addEventListener("click", closeComposer);
    elements.saveNote.addEventListener("click", handleCreateNote);
    elements.importNotes.addEventListener("click", openImportModal);
    elements.exportNotes.addEventListener("click", handleExportNotes);
    elements.clearAllNotes.addEventListener("click", handleClearAllNotes);
    elements.searchInput.addEventListener("input", (event) => {
        state.filter = event.target.value;
        renderNotes();
    });

    elements.notesList.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            return;
        }
        const card = event.target.closest(".note-card");
        if (!card) return;

        const badgeAction = event.target.closest(".badge");
        if (badgeAction && badgeAction.textContent === "查看详情") {
            openModal(card.dataset.id);
            return;
        }

        // 切换折叠状态
        card.classList.toggle("is-expanded");
    });

    elements.notesList.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const card = event.target.closest(".note-card");
        if (!card) return;
        event.preventDefault();
        openModal(card.dataset.id);
    });

    elements.closeModal.addEventListener("click", closeModal);
    elements.noteModal.addEventListener("click", (event) => {
        if (event.target === elements.noteModal) {
            closeModal();
        }
    });
    elements.closeImportModal.addEventListener("click", closeImportModal);
    elements.importModal.addEventListener("click", (event) => {
        if (event.target === elements.importModal) {
            closeImportModal();
        }
    });
    elements.mergeImportBtn.addEventListener("click", () => handleImportNotes("merge"));
    elements.replaceImportBtn.addEventListener("click", () => handleImportNotes("replace"));

    elements.editToggleBtn.addEventListener("click", () => {
        state.isEditingModal = true;
        renderModal();
    });

    elements.cancelEditBtn.addEventListener("click", () => {
        state.isEditingModal = false;
        renderModal();
    });

    elements.saveEditBtn.addEventListener("click", handleSaveEdit);
    elements.deleteNoteBtn.addEventListener("click", handleDeleteNote);

    elements.noteInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeComposer();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleCreateNote();
        }
    });

    elements.editInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            state.isEditingModal = false;
            renderModal();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleSaveEdit();
        }
    });

    elements.importInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeImportModal();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleImportNotes("merge");
        }
    });

    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
            event.preventDefault();
            openComposer();
        }
        if (event.key === "Escape" && elements.noteModal.classList.contains("is-open")) {
            closeModal();
        }
        if (event.key === "Escape" && elements.importModal.classList.contains("is-open")) {
            closeImportModal();
        }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes[STORAGE_KEY]) {
            refreshNotes();
        }
    });

    refreshNotes();
});
