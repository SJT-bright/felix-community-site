// Keep native details/summary semantics; enhance only the height transition.
export function mountSmoothDisclosure(details) {
  const summary = details.querySelector('summary');
  const panel = details.querySelector('.lab-topic__panel');
  const content = panel?.firstElementChild;
  if (!summary || !panel || !content || !panel.animate) return () => {};

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let expanded = details.open;
  let animation = null;
  let targetHeight = 0;
  let disposed = false;

  function updateState() {
    details.dataset.expanded = String(expanded);
    summary.setAttribute('aria-expanded', String(expanded));
    panel.inert = !expanded;
  }

  function settle() {
    const previous = animation;
    animation = null;
    details.open = expanded;
    panel.style.removeProperty('height');
    previous?.cancel();
    delete details.dataset.animating;
    updateState();
  }

  function transitionTo(next) {
    if (disposed) return;
    const from = details.open ? panel.getBoundingClientRect().height : 0;
    expanded = next;
    updateState();
    if (motion.matches) { settle(); return; }

    // Preserve the current visible height when reversing a running animation.
    panel.style.height = `${from}px`;
    animation?.cancel();
    details.open = true;
    targetHeight = expanded ? content.getBoundingClientRect().height : 0;
    if (Math.abs(from - targetHeight) < 1) { settle(); return; }
    details.dataset.animating = 'true';
    const distance = Math.min(1, Math.abs(targetHeight - from) / Math.max(content.getBoundingClientRect().height, 1));
    const current = panel.animate(
      [{ height: `${from}px` }, { height: `${targetHeight}px` }],
      { duration: Math.max(120, (expanded ? 360 : 260) * distance), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
    animation = current;
    current.onfinish = () => { if (animation === current && !disposed) settle(); };
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button > 0) return;
    event.preventDefault();
    transitionTo(!expanded);
  }
  function onToggle() {
    if (!animation) { expanded = details.open; updateState(); }
  }
  function onMotionChange() { if (motion.matches) settle(); }
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (animation && expanded && Math.abs(content.getBoundingClientRect().height - targetHeight) > 1) {
      transitionTo(true);
    }
  }) : null;

  updateState();
  summary.addEventListener('click', onClick);
  details.addEventListener('toggle', onToggle);
  motion.addEventListener('change', onMotionChange);
  resizeObserver?.observe(content);

  return () => {
    disposed = true;
    settle();
    summary.removeEventListener('click', onClick);
    details.removeEventListener('toggle', onToggle);
    motion.removeEventListener('change', onMotionChange);
    resizeObserver?.disconnect();
    summary.removeAttribute('aria-expanded');
    delete details.dataset.expanded;
    panel.inert = false;
  };
}
