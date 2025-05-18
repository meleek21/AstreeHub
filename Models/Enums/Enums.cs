using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public enum EventType
    {
        Général, // Événements non catégorisés
        Réunion, // Toutes les catégories liées aux réunions
        Formation, // Événements d'apprentissage et de développement
        ÉvénementEntreprise, // Événements à l'échelle de l'organisation
        Anniversaire,
        Personnel, // Événements personnels des employés
        Technique, // Événements liés à l'IT/aux systèmes
    }

    public enum EventCategory
    {
        // Sous type Réunion
        [BsonRepresentation(BsonType.String)]
        RéunionÉquipe,

        [BsonRepresentation(BsonType.String)]
        RéunionDépartement,

        [BsonRepresentation(BsonType.String)]
        RéunionClient,

        [BsonRepresentation(BsonType.String)]
        EntretienIndividuel,

        // Sous type Formation
        [BsonRepresentation(BsonType.String)]
        Atelier,

        [BsonRepresentation(BsonType.String)]
        Certification,

        [BsonRepresentation(BsonType.String)]
        Séminaire,

        // Sous type ÉvénementEntreprise
        [BsonRepresentation(BsonType.String)]
        Conférence,

        [BsonRepresentation(BsonType.String)]
        TeamBuilding,

        [BsonRepresentation(BsonType.String)]
        FêteEntreprise,

        // Sous type Personnel
        [BsonRepresentation(BsonType.String)]
        Anniversaire,

        [BsonRepresentation(BsonType.String)]
        AnniversaireTravail,

        [BsonRepresentation(BsonType.String)]
        Absence,

        // Sous type Technique
        [BsonRepresentation(BsonType.String)]
        MaintenanceSystème,

        [BsonRepresentation(BsonType.String)]
        Déploiement,

        // Sous type Général
        [BsonRepresentation(BsonType.String)]
        Autre,

        [BsonRepresentation(BsonType.String)]
        Urgence,
    }

    public enum EventStatus
    {
        [BsonRepresentation(BsonType.String)]
        ÀVenir,

        [BsonRepresentation(BsonType.String)]
        Planifié,

        [BsonRepresentation(BsonType.String)]
        EnCours,

        [BsonRepresentation(BsonType.String)]
        Terminé,

        [BsonRepresentation(BsonType.String)]
        Annulé,
    }

    public enum ReactionType
    {
        [BsonRepresentation(BsonType.String)]
        None,

        [BsonRepresentation(BsonType.String)]
        Jaime,

        [BsonRepresentation(BsonType.String)]
        Jadore,

        [BsonRepresentation(BsonType.String)]
        Brillant,

        [BsonRepresentation(BsonType.String)]
        Bravo,

        [BsonRepresentation(BsonType.String)]
        Youpi,
    }

    public enum RoleType
    {
        EMPLOYEE,
        SUPERADMIN,
        DIRECTOR,
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        Suspended,
    }

    public enum AttendanceStatus
    {
        [BsonRepresentation(BsonType.String)]
        EnAttente,

        [BsonRepresentation(BsonType.String)]
        Accepté,

        [BsonRepresentation(BsonType.String)]
        Refusé,
    }

    public enum NotificationType
    {
        Message,
        PostReaction,
        Comment,
        EventInvitation,
        EventUpdate,
        Birthday,
        EventStatusChange,
        ChannelPost,
        TodoDueReminder,
    }

    public enum PostType
    {
        General, // Regular feed posts
        Channel, // Channel-specific posts
        Library, // Documentation/library posts
        Event, // Event posts (accessible only to superadmin)
    }
}
