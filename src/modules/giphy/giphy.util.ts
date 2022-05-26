const prefix = 'https://i.giphy.com/'
const suffix = '.gif'

export function createUrlFromId(id) {
  if(!id) return null;
  return prefix + id + suffix;
}
