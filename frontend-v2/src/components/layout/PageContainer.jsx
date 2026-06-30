import Sidebar from "./Sidebar";
import Header from "./Header";
import { dashboardShellStyle, dashboardMainStyle } from "../../styles/styles";

/**
 * PageContainer – wraps every dashboard-style page with Sidebar + Header + content area.
 * @param {string}    activePage
 * @param {string}    title
 * @param {string}    subtitle
 * @param {boolean}   showSearch
 * @param {string}    searchPlaceholder
 * @param {Function}  goDashboard | goPOS | goHistory | goProducts | goSettings
 * @param {ReactNode} children    – page body content
 */
export default function PageContainer({
  activePage,
  title,
  subtitle,
  showSearch,
  searchPlaceholder,
  goDashboard,
  goPOS,
  goHistory,
  goProducts,
  goSettings,
  children
}) {
  return (
    <div style={dashboardShellStyle}>
      <Sidebar
        activePage={activePage}
        goDashboard={goDashboard}
        goPOS={goPOS}
        goHistory={goHistory}
        goProducts={goProducts}
        goSettings={goSettings}
      />
      <main style={dashboardMainStyle}>
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
        />
        {children}
      </main>
    </div>
  );
}
