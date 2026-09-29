/* Contacto: validación campo a campo (mismas reglas que el diseño) y envío. */

const form = document.querySelector<HTMLFormElement>('[data-form]');
if (form) {
  const errors: Record<string, string> = JSON.parse(form.dataset.errors || '{}');
  const endpoint = form.dataset.endpoint || '';
  const mailto = form.dataset.mailto || '';
  const success = document.querySelector<HTMLElement>('[data-success]')!;
  const sendErr = form.querySelector<HTMLElement>('[data-send-error]')!;

  type Key = 'n' | 'e' | 'm';
  const fields = {} as Record<Key, { wrap: HTMLElement; input: HTMLInputElement | HTMLTextAreaElement; help: HTMLElement; msg: HTMLElement }>;
  form.querySelectorAll<HTMLElement>('[data-field]').forEach((wrap) => {
    const key = wrap.dataset.field as Key;
    const help = wrap.querySelector<HTMLElement>('.field__help')!;
    fields[key] = { wrap, input: wrap.querySelector('input,textarea')!, help, msg: help.querySelector('[data-msg]')! };
  });

  // empty → incompleto; si no, formato
  const validate = (key: Key): string | null => {
    const v = fields[key].input.value.trim();
    if (!v) return `${key}_empty`;
    if (key === 'n') return v.length >= 2 ? null : 'n_bad';
    if (key === 'e') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'e_bad';
    return v.length >= 10 ? null : 'm_bad';
  };
  const setErr = (key: Key, code: string | null) => {
    const f = fields[key];
    f.wrap.classList.toggle('has-err', !!code);
    f.input.setAttribute('aria-invalid', String(!!code));
    f.help.hidden = !code;
    if (code) f.msg.textContent = errors[code] || '';
  };
  const hasErr = (key: Key) => fields[key].wrap.classList.contains('has-err');

  (Object.keys(fields) as Key[]).forEach((key) => {
    const { wrap, input } = fields[key];
    input.addEventListener('input', () => { if (hasErr(key)) setErr(key, validate(key)); });   // se limpia al corregir
    input.addEventListener('focus', () => { wrap.classList.add('focused'); form.classList.add('is-editing'); });
    input.addEventListener('blur', () => {
      wrap.classList.remove('focused');
      if (!form.querySelector('.field.focused')) form.classList.remove('is-editing');
      if (input.value.trim() || hasErr(key)) setErr(key, validate(key));
    });
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    sendErr.hidden = true;
    const keys = Object.keys(fields) as Key[];
    const next = Object.fromEntries(keys.map((k) => [k, validate(k)])) as Record<Key, string | null>;
    keys.forEach((k) => setErr(k, next[k]));
    const first = keys.find((k) => next[k]);
    if (first) { fields[first].input.focus(); return; }

    const data = { name: fields.n.input.value.trim(), email: fields.e.input.value.trim(), message: fields.m.input.value.trim() };
    if (endpoint) {
      const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
      btn.disabled = true;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(String(res.status));
        form.hidden = true;
        success.hidden = false;
      } catch {
        sendErr.querySelector('[data-msg]')!.textContent = errors.send || '';
        sendErr.hidden = false;
        btn.disabled = false;
      }
    } else {
      // sin endpoint configurado: abre el correo del visitante con el mensaje listo
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      location.href = `mailto:${mailto}?subject=${encodeURIComponent('Jaquito — ' + data.name)}&body=${encodeURIComponent(body)}`;
    }
  });
}

export {};
