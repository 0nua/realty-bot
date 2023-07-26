export default class StringHelper {
    public static ucFirst(str: string): string {
        return str[0].toUpperCase() + str.slice(1);
    }
}