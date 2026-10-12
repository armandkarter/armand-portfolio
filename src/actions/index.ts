import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';
import pool from '../lib/db';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z
        .string({ required_error: "Le nom est obligatoire" })
        .trim()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(100, "Le nom est trop long"),
      email: z
        .string({ required_error: "L'email est obligatoire" })
        .trim()
        .email("Adresse email invalide (ex: exemple@domaine.com)"),
      phone: z
        .string({ required_error: "Le téléphone est obligatoire" })
        .trim()
        .regex(phoneRegex, "Numéro invalide. Doit inclure l'indicatif international (ex: +2290162298969)"),
      message: z
        .string({ required_error: "Le message est obligatoire" })
        .trim()
        .min(10, "Le message doit contenir au moins 10 caractères")
        .max(2000, "Le message dépasse la limite autorisée"),
    }),
    handler: async (input) => {
      const { name, email, phone, message } = input;

      // 1. Sauvegarde en BDD PostgreSQL (Neon)
      try {
        await pool.query(
          'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4)',
          [name, email, phone, message]
        );
      } catch (dbError) {
        console.error('Erreur SQL lors de l\'enregistrement du contact :', dbError);
        throw new Error("Impossible d'enregistrer votre message en base de données.");
      }

      // 2. Envoi de l'email via Resend
      try {
        // Récupération de la clé depuis process.env ou import.meta.env
        const apiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;

        if (!apiKey) {
          throw new Error("La clé d'API Resend (RESEND_API_KEY) n'est pas définie dans l'environnement.");
        }

        const resend = new Resend(apiKey);

        await resend.emails.send({
          from: 'Portfolio Terminal <onboarding@resend.dev>',
          to: process.env.CONTACT_RECEIVER_EMAIL || import.meta.env.CONTACT_RECEIVER_EMAIL || 'armanddjeha@gmail.com',
          replyTo: email,
          subject: `[Portfolio Terminal] Nouveau message de ${name}`,
          html: `
            <div style="font-family: monospace; background-color: #020302; color: #ffffff; padding: 20px; border: 1px solid #52ff00;">
              <h2 style="color: #52ff00;">&gt; Nouveau message reçu depuis le terminal</h2>
              <hr style="border-color: #1d4317;" />
              <p><strong>Nom :</strong> ${name}</p>
              <p><strong>Email :</strong> <a href="mailto:${email}" style="color: #52ff00;">${email}</a></p>
              <p><strong>Téléphone :</strong> ${phone}</p>
              <br />
              <p><strong>Message :</strong></p>
              <div style="background-color: #050605; padding: 15px; border-left: 3px solid #52ff00; color: #d1d5db;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          `,
        });

        console.log('Email envoyé avec succès via Resend !');
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email via Resend :', emailError);
      }

      return { success: true, message: "Message enregistré et envoyé avec succès !" };
    },
  }),
};