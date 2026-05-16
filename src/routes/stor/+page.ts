import { storDocumentList } from '$lib/content/stor';

export function load() {
  return {
    documents: storDocumentList,
  };
}
