import { JobReviewPage } from "@/components/jobs/job-review-page";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function JobReviewRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <>
      <Header />
      <JobReviewPage jobId={id} />
      <Footer />
    </>
  );
}

