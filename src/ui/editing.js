/**
 * Which saved animation, if any, the editor is updating.
 */
import { state } from '../state.js';
import { $ } from '../lib/dom.js';
import { emit, SESSION_DIRTY } from '../lib/events.js';

/** @param {{ id: string, name: string } | null} record */
export function setEditing(record) {
  state.editingId = record?.id ?? null;
  state.editingName = record?.name ?? '';
  $('animName').value = state.editingName;
  syncEditing();
  emit(SESSION_DIRTY);
}

export function syncEditing() {
  const editing = Boolean(state.editingId);
  $('saveAnim').textContent = editing ? 'Update' : 'Save for printing';
  $('saveAsNew').hidden = $('editNote').hidden = !editing;
  $('editName').textContent = `"${state.editingName}"`;
}
