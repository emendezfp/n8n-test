const fetch = require('node-fetch');

const token = process.env.GITHUB_TOKEN;
const owner = process.env.REPO_OWNER;
const name = process.env.REPO_NAME;

const query = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      issues(first: 100) {
        nodes {
          number
          title
          url
          projectItems(first: 5) {
            nodes {
              project {
                ... on ProjectV2 {
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: { owner, name },
  }),
})
  .then(res => res.json())
  .then(json => {
    if (json.errors) {
      console.error('❌ GraphQL Errors:', json.errors);
      process.exit(1);
    }

    const issues = json.data.repository.issues.nodes.filter(
      i => i.projectItems.nodes.length > 0
    );

    console.log(`✅ ${issues.length} issue(s) linked to projects:`);
    for (const issue of issues) {
      const projects = issue.projectItems.nodes.map(p => p.project.title).join(', ');
      console.log(`#${issue.number} - ${issue.title} → ${projects}`);
    }
  })
  .catch(err => {
    console.error('❌ Fetch error:', err);
    process.exit(1);
  });
