import { queryOptions, useQuery } from "@tanstack/react-query"
import { readAccountIndex } from "./accounts"

export const deviceAccountsQuery = queryOptions({
  queryKey: ["device-accounts"],
  queryFn: readAccountIndex,
})

export function useDeviceAccounts() {
  return useQuery(deviceAccountsQuery)
}
