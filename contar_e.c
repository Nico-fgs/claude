#include <stdio.h>
#include <string.h>

#define MAX_FRASE 1024

int main(void)
{
    char frase[MAX_FRASE];
    int contador = 0;

    printf("Escribe una frase: ");
    if (fgets(frase, sizeof(frase), stdin) == NULL) {
        printf("No se ha leido ninguna frase.\n");
        return 1;
    }

    for (size_t i = 0; frase[i] != '\0'; i++) {
        unsigned char c = (unsigned char)frase[i];

        if (c == 'e' || c == 'E') {
            contador++;
        } else if (c == 0xC3) {
            /* En UTF-8, 'é' es 0xC3 0xA9 y 'É' es 0xC3 0x89 */
            unsigned char siguiente = (unsigned char)frase[i + 1];
            if (siguiente == 0xA9 || siguiente == 0x89) {
                contador++;
                i++;
            }
        }
    }

    printf("Has escrito %d letra(s) 'e' en la frase.\n", contador);
    return 0;
}
