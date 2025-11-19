import { goToLink } from './utils';

export const goToArchivesPage = (paramName?: string, paramValue?: string) => goToLink('/archives', paramName, paramValue);

export const goToTagsPage = (tag?: string) => goToLink('/tags', tag ? 'tag' : undefined, tag);

