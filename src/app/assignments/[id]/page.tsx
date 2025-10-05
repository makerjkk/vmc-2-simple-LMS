import { RoleGuard } from '@/components/auth/role-guard';
import { AssignmentDetail } from '@/features/assignments/components/assignment-detail';
import { HomeLayout } from '@/components/layout/home-layout';

interface AssignmentDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 과제 상세 페이지
 * 학습자만 접근 가능하며 과제 상세 정보와 제출 인터페이스를 제공
 */
export default async function AssignmentDetailPage({
  params,
}: AssignmentDetailPageProps) {
  const { id } = await params;
  
  return (
    <RoleGuard allowedRoles={['learner']}>
      <HomeLayout>
        <div className="container mx-auto px-4 py-8">
          <AssignmentDetail assignmentId={id} />
        </div>
      </HomeLayout>
    </RoleGuard>
  );
}
