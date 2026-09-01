from pathlib import Path

p = Path('src/react/AtlasApp.tsx')
s = p.read_text()
old = "      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'test') { event.preventDefault(); rounds.outlines.advanceNow(); }"
new = "      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'test') { event.preventDefault(); actions.advance('outlines'); }"
if s.count(old) != 1:
    raise RuntimeError(f'keyboard action patch expected once, found {s.count(old)}')
s = s.replace(old, new, 1)
old = "    advance: (domain) => { if (domain === 'flags') { store.advance(); rounds.flags.announceResult(); finishInteraction(null); } else if (domain === 'outlines') { store.advanceOutline(); rounds.outlines.announceResult(); finishInteraction(null); } else if (domain === 'neighbors') rounds.neighbors.advance(); },"
new = "    advance: (domain) => { if (domain === 'flags') { store.advance(); rounds.flags.announceResult(); finishInteraction(null); } else if (domain === 'outlines') { if (!rounds.outlines.advanceNow()) { store.advanceOutline(); rounds.outlines.announceResult(); finishInteraction(null); } } else if (domain === 'neighbors') rounds.neighbors.advance(); },"
if s.count(old) != 1:
    raise RuntimeError(f'advance action patch expected once, found {s.count(old)}')
p.write_text(s.replace(old, new, 1))
print('Routed Outlines Play dwell skip through AtlasActions.')
