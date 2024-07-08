declare module "*.svg" { };

declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

declare global {
  interface Window {
    $api: {
      getArticleViewCount: (id: string, url: string, callback: (viewCountData: any) => void) => void;
    };
  }
}
