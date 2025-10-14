# Website Improvement Plan
## Eliana Brereton Portfolio - Dev Branch

**Goal**: Transform the Jekyll-based portfolio into a sleek, minimalist, custom-coded website that's professional and modern.

---

## 1. Design Philosophy

### Minimalist Principles
- **Clean typography**: Focus on readable fonts with strong hierarchy
- **White space**: Generous spacing for breathing room
- **Limited color palette**: 2-3 main colors max (likely neutrals + one accent)
- **Simple navigation**: Clear, unobtrusive menu
- **Content-first**: Let your research and work shine
- **Fast loading**: No heavy frameworks, vanilla HTML/CSS/JS

### Inspiration Direction
- Swiss/Brutalist design aesthetic
- Academic portfolio meets modern tech
- Focus on readability and scanability
- Professional but approachable

---

## 2. Technical Architecture

### Structure
```
/
├── index.html          (Home)
├── projects.html       (Projects & Research)
├── education.html      (Education & Volunteering)
├── resume.html         (Resume & CV)
├── contact.html        (Contact)
├── css/
│   ├── reset.css       (CSS reset for consistency)
│   ├── variables.css   (Design tokens: colors, fonts, spacing)
│   └── main.css        (Core styles)
├── js/
│   └── main.js         (Minimal interactions if needed)
└── img/                (Existing images)
```

### No Dependencies
- Pure HTML5, CSS3, vanilla JavaScript
- No Jekyll, no build process
- No external frameworks
- Self-hosted fonts (or system fonts for speed)

---

## 3. Design System

### Typography
- **Headings**: System font stack or simple serif (e.g., Georgia, Times)
- **Body**: Sans-serif system stack (SF Pro, Segoe UI, Roboto)
- **Monospace**: For any code/technical elements
- **Scale**: Clear hierarchy (h1: 2.5rem, h2: 2rem, h3: 1.5rem, body: 1rem)

### Color Palette (Proposed)
- **Background**: Off-white (#FAFAFA or #F5F5F5)
- **Text**: Near-black (#1A1A1A or #2C2C2C)
- **Accent**: Muted blue or teal for links/highlights (#2563EB or #0891B2)
- **Subtle elements**: Light gray (#E5E5E5) for dividers

### Spacing System
- Base unit: 8px
- Scale: 8, 16, 24, 32, 48, 64, 96px
- Consistent margins and padding throughout

### Layout
- **Max content width**: 800-900px for readability
- **Centered layout** with side margins
- **Responsive**: Mobile-first approach
- **Grid/Flexbox**: Modern CSS layout

---

## 4. Page-by-Page Updates

### Home (index.html)
- Hero section with name and one-line descriptor
- Brief introduction (2-3 sentences)
- Clear call-to-action links to main sections
- Minimal, impactful design

### Projects & Research (projects.html)
- Card or list layout for each project
- Clear headings and descriptions
- Skills demonstrated sections
- Links to papers/documents
- Visual hierarchy for graduate vs. undergraduate work

### Education & Volunteering (education.html)
- Timeline or structured list
- Current work prominently featured
- Certifications and skills clearly displayed
- Clean, scannable format

### Resume & CV (resume.html)
- Embedded PDF viewers or download buttons
- Brief context about each document
- Professional presentation

### Contact (contact.html)
- Simple form or direct links
- Social media icons (minimal design)
- Email clearly displayed
- No clutter

---

## 5. Navigation

### Design
- Fixed or sticky top navigation bar
- Logo/name on left
- Menu items on right
- Hamburger menu for mobile
- Active page indicator
- Smooth transitions

### Menu Items
- Home
- Projects & Research
- Education & Volunteering
- Resume & CV
- Contact

---

## 6. Special Features

### Subtle Interactions
- Smooth scroll behavior
- Hover states on links/buttons
- Fade-in animations on scroll (subtle)
- Focus states for accessibility

### Performance
- Optimize all images
- Minimize CSS/JS
- Lazy loading for images
- Fast first contentful paint

### Accessibility
- Semantic HTML5
- ARIA labels where needed
- Keyboard navigation
- High contrast ratios
- Alt text for images

---

## 7. Implementation Steps

1. ✅ Create dev branch
2. ✅ Draft improvement plan (this document)
3. Create base HTML structure for all pages
4. Build CSS reset and variables
5. Implement main CSS styles
6. Build homepage (index.html)
7. Build projects page
8. Build education page
9. Build resume/CV page
10. Build contact page
11. Add navigation component
12. Add any minimal JavaScript interactions
13. Test responsiveness across devices
14. Optimize performance
15. Review accessibility
16. Final review and refinements
17. Merge to main branch
18. Deploy

---

## 8. Content Refinements

### Writing Updates
- Tighten copy for clarity
- Use active voice
- Lead with impact
- Consistent tone throughout
- Professional but personable

### Visual Assets
- Possibly update headshot (current one is good)
- Ensure all PDFs are optimized
- Consider adding project thumbnails/screenshots if available

---

## 9. SEO & Meta

- Proper meta tags on all pages
- OpenGraph tags for social sharing
- Descriptive page titles
- Clean URL structure
- Sitemap.xml
- Favicon

---

## 10. Success Metrics

### Before Launch
- All pages load under 1 second
- Mobile responsive (320px - 1920px)
- Passes accessibility audit
- Cross-browser tested (Chrome, Firefox, Safari)
- All links work
- All PDFs accessible

### After Launch
- Clean, professional first impression
- Easy to navigate
- Content is scannable
- Highlights AI ethics expertise
- Makes you memorable to recruiters/collaborators

---

## Notes & Questions

- **Domain**: Keep current domain (brereton.me based on CNAME file)
- **Hosting**: GitHub Pages (same as current)
- **Browser support**: Modern browsers (last 2 versions)
- **Future additions**: Blog section? Project case studies?

---

**Next Step**: Review this plan, make adjustments, then begin implementation starting with base HTML structure.
