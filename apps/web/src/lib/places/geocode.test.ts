import { describe, expect, test } from "bun:test"
import { geocodeUrl, parseGeocodeResponse } from "./geocode"

describe("geocodeUrl", () => {
  test("asks Nominatim for five French results", () => {
    const url = new URL(geocodeUrl("Place de la Gare"))
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search")
    expect(url.searchParams.get("format")).toBe("jsonv2")
    expect(url.searchParams.get("limit")).toBe("5")
    expect(url.searchParams.get("accept-language")).toBe("fr")
    expect(url.searchParams.get("q")).toBe("Place de la Gare")
  })

  test("encodes and trims the query", () => {
    const url = geocodeUrl("  Rue du Lac 12, 1000 Lausanne & co ")
    expect(url).toContain("q=Rue+du+Lac+12%2C+1000+Lausanne+%26+co")
    expect(url).not.toContain("q=+")
  })
})

describe("parseGeocodeResponse", () => {
  test("reads labels and string coordinates", () => {
    const json = [
      { display_name: "Lausanne, Vaud, Suisse", lat: "46.5196535", lon: "6.6322734", place_id: 1 },
      { display_name: "Genève, Suisse", lat: "46.2017559", lon: "6.1466014" },
    ]
    expect(parseGeocodeResponse(json)).toEqual([
      { label: "Lausanne, Vaud, Suisse", latitude: 46.5196535, longitude: 6.6322734 },
      { label: "Genève, Suisse", latitude: 46.2017559, longitude: 6.1466014 },
    ])
  })

  test("skips invalid entries", () => {
    const json = [
      { display_name: "", lat: "46.5", lon: "6.6" },
      { display_name: "Sans latitude", lon: "6.6" },
      { display_name: "Texte", lat: "abc", lon: "6.6" },
      { display_name: "Hors limites", lat: "95", lon: "6.6" },
      { display_name: "Nombre brut", lat: 46.5, lon: 6.6 },
      null,
      { display_name: "Berne", lat: "46.948", lon: "7.4474" },
    ]
    expect(parseGeocodeResponse(json)).toEqual([{ label: "Berne", latitude: 46.948, longitude: 7.4474 }])
  })

  test("returns nothing when the payload is not a list", () => {
    expect(parseGeocodeResponse({ error: "Bad request" })).toEqual([])
    expect(parseGeocodeResponse(null)).toEqual([])
  })
})
