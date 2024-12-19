import * as wmill from "windmill-client";
import createClient, { type Middleware } from "openapi-fetch";

export async function main(
  nextcloudResource: string,
  userId: string | null = null,
  approveCallbackUri: string,
  rejectCallbackUri: string,
  description: string,
  useAppApiAuth: boolean = false,
) {
  const ncResource = await wmill.getResource(
    nextcloudResource,
  );

  const client = createClient<paths>({ baseUrl: ncResource.baseUrl });
  const authMiddleware: Middleware = {
    async onRequest({ request, options }) {
      // fetch token, if it doesn’t exist
      // add Authorization header to every request
      request.headers.set("Authorization", `Basic ${btoa((userId || ncResource.username) + ':' + ncResource.password)}`);
      if (useAppApiAuth) {
        request.headers.set("AA-VERSION", "2.3.0",);
        request.headers.set("EX-APP-ID", "flow",);
        request.headers.set("EX-APP-VERSION", "1.0.1",);
        request.headers.set("AUTHORIZATION-APP-API", btoa(
          `${userId || ncResource.username}:${ncResource.password}`,
        ));
      }
      return request;
    },
  };
  client.use(authMiddleware);

  const data = {
    approveCallbackUri,
    rejectCallbackUri,
    description,
  }

  try {
    const resp = await await client.POST("/ocs/v2.php/apps/approve_links/api/v1/link", {
      params: {
        header: {
          "OCS-APIRequest": true,
        },
        query: {
          format: "json",
        },

      },
      body: data,
    });
    console.debug('RESPONSE', resp.data)
    return {
      link: resp.data.ocs.data.link,
    }
  } catch (e) {
    console.debug('error', e)
  }


  return {}

}