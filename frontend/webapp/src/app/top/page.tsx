import type { NextPage } from "next";

import { AppSidebar } from "../../components/layout/sidebar";

const Page: NextPage = () => {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 p-4">
        loginしたよ
      </main>
    </div>
  )
}

export default Page
