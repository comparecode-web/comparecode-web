export type ProfileLanguage = "c" | "cpp" | "csharp" | "clojure" | "go" | "java" | "objectivec" | "php" | "ruby" | "rust" | "shell" | "sql" | "swift";
interface CodeProfile {
  keywords: ReadonlySet<string>;
  types: ReadonlySet<string>;
  lineComments: readonly string[];
  blockComment?: readonly [string, string];
  nestedComments?: boolean;
  ignoreCase?: boolean;
}
const words = (source: string) => new Set(source.split(" "));
const cKeywords = "auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while _Alignas _Alignof _Atomic _Generic _Noreturn _Static_assert _Thread_local";
const cTypes = "void char short int long float double signed unsigned bool _Bool _Complex size_t";
const cppKeywords = `${cKeywords} alignas alignof and and_eq asm bitand bitor catch class compl concept consteval constexpr constinit const_cast co_await co_return co_yield decltype delete dynamic_cast explicit export false friend mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public reinterpret_cast requires static_assert static_cast template this thread_local throw true try typename using virtual xor xor_eq`;

export const CODE_PROFILES: Record<ProfileLanguage, CodeProfile> = {
  c: { keywords: words(cKeywords), types: words(cTypes), lineComments: ["//"], blockComment: ["/*", "*/"] },
  cpp: { keywords: words(cppKeywords), types: words(`${cTypes} wchar_t char8_t char16_t char32_t`), lineComments: ["//"], blockComment: ["/*", "*/"] },
  csharp: {
    keywords: words("abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern false finally fixed for foreach goto if implicit in interface internal is lock namespace new null operator out override params private protected public readonly record ref required return sealed sizeof stackalloc static struct switch this throw true try typeof unchecked unsafe using virtual volatile while yield var get set init with when where"),
    types: words("bool byte sbyte char decimal double float int uint long ulong object short ushort string void dynamic nint nuint"), lineComments: ["//"], blockComment: ["/*", "*/"]
  },
  clojure: {
    keywords: words("def defn defn- defmacro defmethod defmulti defonce defrecord deftype ns in-ns require import refer use let letfn loop recur if if-not if-let when when-not when-let cond case do fn quote var set! throw try catch finally new . true false nil and or not for doseq binding with-open lazy-seq"),
    types: words("String Boolean Long Double Object"), lineComments: [";"],
  },
  go: {
    keywords: words("break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil iota"),
    types: words("bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr any comparable"), lineComments: ["//"], blockComment: ["/*", "*/"]
  },
  java: {
    keywords: words("abstract assert break case catch class const continue default do else enum exports extends final finally for goto if implements import instanceof interface module native new non-sealed null open opens package permits private protected provides public record requires return sealed static strictfp super switch synchronized this throw throws to transient transitive try uses var void volatile while with yield true false"),
    types: words("boolean byte char double float int long short String Object"), lineComments: ["//"], blockComment: ["/*", "*/"]
  },
  objectivec: {
    keywords: words(`${cKeywords} interface implementation end protocol property synthesize dynamic selector encode class public private protected package try catch finally throw synchronized autoreleasepool optional required import YES NO nil self super nonatomic atomic strong weak copy retain assign readonly readwrite`),
    types: words(`${cTypes} id Class SEL BOOL NSInteger NSUInteger NSString NSObject instancetype`), lineComments: ["//"], blockComment: ["/*", "*/"]
  },
  php: {
    keywords: words("abstract and array as break callable case catch class clone const continue declare default die do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends final finally fn for foreach from function global goto if implements include include_once instanceof insteadof interface isset list match namespace new null or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield true false"),
    types: words("bool boolean int integer float double string object mixed never void iterable"), lineComments: ["//", "#"], blockComment: ["/*", "*/"], ignoreCase: true
  },
  ruby: {
    keywords: words("BEGIN END alias and begin break case class def defined? do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield __FILE__ __LINE__ __ENCODING__"),
    types: words("String Integer Float Array Hash Symbol Object"), lineComments: ["#"]
  },
  rust: {
    keywords: words("as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while abstract become box do final macro override priv typeof unsized virtual yield try gen"),
    types: words("bool char str i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 String Vec Option Result"), lineComments: ["//"], blockComment: ["/*", "*/"], nestedComments: true
  },
  shell: {
    keywords: words("if then else elif fi for while until do done case esac in function select time coproc ! [[ ]]"),
    types: words("echo printf read export local readonly declare typeset unset source eval exec exit return shift test cd pwd set trap"), lineComments: ["#"]
  },
  sql: {
    keywords: words("select from where insert into values update set delete create alter drop table view index database schema join inner left right full outer cross on as distinct group by having order asc desc limit offset fetch union all intersect except with recursive case when then else end and or not null true false is in exists between like ilike escape primary key foreign references unique check default constraint begin commit rollback grant revoke returning over partition window procedure function trigger replace truncate explain analyze cast coalesce count sum min max avg"),
    types: words("int integer bigint smallint tinyint decimal numeric float real double boolean bool char varchar nvarchar text date time timestamp interval json jsonb blob binary"), lineComments: ["--"], blockComment: ["/*", "*/"], nestedComments: true, ignoreCase: true
  },
  swift: {
    keywords: words("actor associatedtype async await borrowing break case catch class consuming continue convenience default defer deinit didSet distributed do dynamic else enum extension fallthrough false fileprivate final for func guard if import in indirect infix init inout internal is isolated lazy let macro mutating nil nonisolated nonmutating open operator optional override package postfix precedencegroup prefix private protocol public repeat required rethrows return self Self set some static struct subscript super switch throws throw true try typealias unowned var weak where while willSet get any"),
    types: words("Any AnyObject Bool Character Double Float Int Int8 Int16 Int32 Int64 UInt UInt8 UInt16 UInt32 UInt64 String Void Never"), lineComments: ["//"], blockComment: ["/*", "*/"], nestedComments: true
  }
};

export function profileWordKind(word: string, profile: CodeProfile): "keyword" | "type" | undefined {
  if (profile.ignoreCase) word = word.toLowerCase();
  return profile.keywords.has(word) ? "keyword" : profile.types.has(word) ? "type" : undefined;
}
