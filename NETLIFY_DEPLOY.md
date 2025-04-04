# Netlify Deployment Guide for Portfolio Website

## Prerequisites

- A Netlify account
- Git repository with your portfolio website
- Google Gemini API key (for the chatbot functionality)

## Deployment Steps

1. **Sign up or log in to Netlify**
   - Go to [Netlify](https://www.netlify.com/) and sign up or log in

2. **Deploy your site**
   - Click "Add new site" > "Import an existing project"
   - Connect to your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your portfolio website repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.`

3. **Set up environment variables**
   - Go to Site settings > Environment variables
   - Add the following environment variables:
     - `GEMINI_API_KEY`: Your Google Gemini API key

4. **Configure the domain**
   - Go to Site settings > Domain management
   - Add your custom domain or use the free Netlify subdomain

5. **Verify deployment**
   - Check your site's deployment status in the Netlify dashboard
   - Once deployed, visit your site URL to verify it's working correctly

## Troubleshooting

- **Chatbot not working**: Verify your Gemini API key is correct
- **Build failures**: Check the Netlify build logs for errors
- **Styling issues**: Make sure all CSS files are properly linked

## Updating Your Site

After making changes to your site:
1. Commit and push changes to your Git repository
2. Netlify will automatically rebuild and deploy your site

## Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Google Generative AI Documentation](https://developers.generativeai.google/products/gemini) 