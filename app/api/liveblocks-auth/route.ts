import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import {
  getCurrentProjectIdentityWithUser,
  userHasProjectAccess,
} from "@/lib/project-access";

export async function POST(request: Request) {
  const { userId, primaryEmailAddress, user } = await getCurrentProjectIdentityWithUser();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();

  if (!room || typeof room !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  const hasAccess = await userHasProjectAccess(room, { userId, primaryEmailAddress });

  if (!hasAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  const lb = getLiveblocks();

  await lb.getOrCreateRoom(room, { defaultAccesses: [] });

  const name =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getUserColor(userId);

  const session = lb.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
