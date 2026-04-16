/**
 * 요구사항 데이터에 요청자 및 날짜 정보를 자동 보강한다.
 * page.tsx에서 3회 중복되던 enrichment 로직을 통합.
 */
export function enrichRequirements(
  requirements: any,
  requesterName: string,
): any {
  if (!requirements) return requirements;

  const currentDate = new Date().toISOString();

  return {
    ...requirements,
    categories: requirements.categories?.map((cat: any) => ({
      ...cat,
      subCategories: cat.subCategories?.map((sub: any) => ({
        ...sub,
        requirements: sub.requirements?.map((req: any) => ({
          ...req,
          requester: req.requester || requesterName,
          initialRequestDate: req.initialRequestDate || currentDate,
        })),
      })),
    })),
  };
}
