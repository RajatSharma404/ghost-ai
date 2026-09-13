import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export interface ProjectIdentity {
  userId: string | null
  primaryEmailAddress: string | null
}

export interface ProjectIdentityWithUser extends ProjectIdentity {
  user: Awaited<ReturnType<typeof currentUser>>
}

export async function getCurrentProjectIdentityWithUser(): Promise<ProjectIdentityWithUser> {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      primaryEmailAddress: null,
      user: null,
    }
  }

  const user = await currentUser()

  return {
    userId,
    primaryEmailAddress:
      user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null,
    user,
  }
}

export async function getCurrentProjectIdentity(): Promise<ProjectIdentity> {
  const { userId, primaryEmailAddress } = await getCurrentProjectIdentityWithUser()
  return { userId, primaryEmailAddress }
}

export async function getAccessibleProject(
  projectId: string,
  identity: ProjectIdentity
) {
  if (!identity.userId) return null

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: identity.primaryEmailAddress
        ? [
            { ownerId: identity.userId },
            {
              collaborators: {
                some: {
                  email: {
                    equals: identity.primaryEmailAddress,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]
        : [{ ownerId: identity.userId }],
    },
  })
}

export async function userHasProjectAccess(
  projectId: string,
  identity: ProjectIdentity
) {
  const project = await getAccessibleProject(projectId, identity)
  return Boolean(project)
}
