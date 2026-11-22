// Keyboard and mouse for Velvet Vault. Keys are read as a held set so the
// game can poll them once per fixed step; clicks queue one throw per press.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    mx: 0,
    my: 0,
    run: false,
    sneak: false,
    throwDecoy: null,
    smoke: false,
    emp: false,
    pressed: new Set(),
    attach() {
      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        if (!e.repeat) this.pressed.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
        keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      });
      window.addEventListener('keyup', (e) => {
        keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      });
      canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        this.throwDecoy = { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
        this.pressed.add('click');
      });
      window.addEventListener('blur', () => keys.clear());
    },
    /** Poll the held keys into one movement vector for this step. */
    poll() {
      const left = keys.has('a') || keys.has('ArrowLeft');
      const right = keys.has('d') || keys.has('ArrowRight');
      const up = keys.has('w') || keys.has('ArrowUp');
      const down = keys.has('s') || keys.has('ArrowDown');
      this.mx = (right ? 1 : 0) - (left ? 1 : 0);
      this.my = (down ? 1 : 0) - (up ? 1 : 0);
      this.run = keys.has('Shift');
      this.sneak = keys.has('c') || keys.has('Control');
      const out = {
        mx: this.mx, my: this.my, run: this.run, sneak: this.sneak,
        throwDecoy: this.throwDecoy, smoke: false, emp: false,
      };
      if (this.pressed.has('q')) { out.smoke = true; this.pressed.delete('q'); }
      if (this.pressed.has('e')) { out.emp = true; this.pressed.delete('e'); }
      this.throwDecoy = null;
      return out;
    },
    /** True once when the key was pressed since the last call. */
    consume(name) {
      if (this.pressed.has(name)) { this.pressed.delete(name); return true; }
      return false;
    },
    clearPressed() { this.pressed.clear(); },
  };
  return input;
}
