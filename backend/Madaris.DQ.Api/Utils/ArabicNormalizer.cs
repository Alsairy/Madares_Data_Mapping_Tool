namespace Madaris.DQ.Api.Utils;
public static class ArabicNormalizer
{
    public static string Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var s = input.Trim();
        // Basic Arabic normalization: remove tatweel, unify alef/ya/ta marbuta, remove diacritics (rough)
        s = s.Replace("ـ", ""); // tatweel
        s = s.Replace("أ", "ا").Replace("إ", "ا").Replace("آ", "ا");
        s = s.Replace("ى", "ي").Replace("ة", "ه");
        // remove common diacritics
        var diacritics = new[] {'\u064B','\u064C','\u064D','\u064E','\u064F','\u0650','\u0651','\u0652'};
        foreach (var d in diacritics) s = s.Replace(d.ToString(), "");
        // collapse spaces
        while (s.Contains("  ")) s = s.Replace("  ", " ");
        return s;
    }
}
