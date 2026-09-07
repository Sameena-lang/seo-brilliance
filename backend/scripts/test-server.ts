import express from 'express';

const app = express();
const PORT = 5001;

const layout = (title: string, desc: string, body: string, extraHead: string = '', h1: string = '<h1>Default H1</h1>') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${title !== null ? `<title>${title}</title>` : ''}
  ${desc !== null ? `<meta name="description" content="${desc}">` : ''}
  ${extraHead}
</head>
<body>
  ${h1}
  ${body}
</body>
</html>
`;

app.get('/', (req, res) => {
  const body = `
    <a href="/clean">Clean</a>
    <a href="/title-missing">Title Missing</a>
    <a href="/title-too-long">Title Too Long</a>
    <a href="/title-too-short">Title Too Short</a>
    <a href="/title-duplicate-1">Title Dup 1</a>
    <a href="/title-duplicate-2">Title Dup 2</a>
    <a href="/meta-desc-missing">Meta Desc Missing</a>
    <a href="/meta-desc-too-long">Meta Desc Too Long</a>
    <a href="/meta-desc-too-short">Meta Desc Too Short</a>
    <a href="/meta-desc-duplicate-1">Meta Desc Dup 1</a>
    <a href="/meta-desc-duplicate-2">Meta Desc Dup 2</a>
    <a href="/h1-missing">H1 Missing</a>
    <a href="/h1-multiple">H1 Multiple</a>
    <a href="/heading-structure">Heading Structure</a>
    <a href="/image-missing-alt">Image Missing Alt</a>
    <a href="/canonical-missing">Canonical Missing</a>
    <a href="/robots-noindex">Robots Noindex</a>
    <a href="/broken-link">Broken Link</a>
    <a href="/redirect-chain-1">Redirect Chain 1</a>
    <a href="/schema-error">Schema Error</a>
  `;
  res.send(layout('Test Server Root - Perfect SEO Title Here', 'A perfect meta description that is exactly the right length for testing.', body, '<link rel="canonical" href="http://localhost:5001/" />'));
});

app.get('/clean', (req, res) => {
  res.send(layout(
    'Clean Page - Perfect SEO Title Here',
    'A perfect meta description that is exactly the right length for testing.',
    '<p>Content goes here.</p>',
    '<link rel="canonical" href="http://localhost:5001/clean" />',
    '<h1>Clean Page H1</h1>'
  ));
});

app.get('/title-missing', (req, res) => {
  res.send(layout(null as any, 'Valid desc for title missing page that is long enough to pass.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/title-missing" />'));
});

app.get('/title-too-long', (req, res) => {
  res.send(layout('This is a ridiculously long title that goes well over the sixty character limit we set in our rules', 'Valid desc for title too long page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/title-too-long" />'));
});

app.get('/title-too-short', (req, res) => {
  res.send(layout('Short', 'Valid desc for title too short page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/title-too-short" />'));
});

app.get('/title-duplicate-1', (req, res) => {
  res.send(layout('Duplicate Title For Testing', 'Valid desc 1 for duplicate title page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/title-duplicate-1" />'));
});
app.get('/title-duplicate-2', (req, res) => {
  res.send(layout('Duplicate Title For Testing', 'Valid desc 2 for duplicate title page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/title-duplicate-2" />'));
});

app.get('/meta-desc-missing', (req, res) => {
  res.send(layout('Meta Desc Missing Page Title Is Good', null as any, '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/meta-desc-missing" />'));
});

app.get('/meta-desc-too-long', (req, res) => {
  res.send(layout('Meta Desc Too Long Page Title Is Good', 'a'.repeat(161), '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/meta-desc-too-long" />'));
});

app.get('/meta-desc-too-short', (req, res) => {
  res.send(layout('Meta Desc Too Short Page Title Is Good', 'Too short desc', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/meta-desc-too-short" />'));
});

app.get('/meta-desc-duplicate-1', (req, res) => {
  res.send(layout('Meta Desc Dup 1 Page Title Is Good', 'This is a duplicate meta description that is long enough to pass length checks.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/meta-desc-duplicate-1" />'));
});
app.get('/meta-desc-duplicate-2', (req, res) => {
  res.send(layout('Meta Desc Dup 2 Page Title Is Good', 'This is a duplicate meta description that is long enough to pass length checks.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/meta-desc-duplicate-2" />'));
});

app.get('/h1-missing', (req, res) => {
  res.send(layout('H1 Missing Page Title Is Good', 'Valid desc for H1 missing page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/h1-missing" />', ''));
});

app.get('/h1-multiple', (req, res) => {
  res.send(layout('H1 Multiple Page Title Is Good', 'Valid desc for H1 multiple page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/h1-multiple" />', '<h1>One</h1><h1>Two</h1>'));
});

app.get('/heading-structure', (req, res) => {
  res.send(layout('Heading Structure Page Title Is Good', 'Valid desc for heading structure page that is long enough.', '<p>Body</p>', '<link rel="canonical" href="http://localhost:5001/heading-structure" />', ''));
});

app.get('/image-missing-alt', (req, res) => {
  res.send(layout('Image Missing Alt Page Title Is Good', 'Valid desc for image missing alt page that is long enough.', '<img src="/test.jpg">', '<link rel="canonical" href="http://localhost:5001/image-missing-alt" />'));
});

app.get('/canonical-missing', (req, res) => {
  res.send(layout('Canonical Missing Page Title Is Good', 'Valid desc for canonical missing page that is long enough.', '<p>Body</p>', ''));
});

app.get('/robots-noindex', (req, res) => {
  res.send(layout('Robots Noindex Page Title Is Good', 'Valid desc for robots noindex page that is long enough.', '<p>Body</p>', '<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="http://localhost:5001/robots-noindex" />'));
});

app.get('/broken-link', (req, res) => {
  res.send(layout('Broken Link Page Title Is Good', 'Valid desc for broken link page that is long enough.', '<a href="/this-does-not-exist">Broken</a>', '<link rel="canonical" href="http://localhost:5001/broken-link" />'));
});

app.get('/redirect-chain-1', (req, res) => {
  res.redirect(301, '/redirect-chain-2');
});

app.get('/redirect-chain-2', (req, res) => {
  res.redirect(301, '/clean');
});

app.get('/schema-error', (req, res) => {
  res.send(layout('Schema Error Page Title Is Good', 'Valid desc for schema error page that is long enough.', '<p>Body</p>', '<script type="application/ld+json">{ invalid_json: true, }</script><link rel="canonical" href="http://localhost:5001/schema-error" />'));
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
