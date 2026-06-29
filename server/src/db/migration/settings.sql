
CREATE TABLE settings (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR (50),
key VARCHAR (50),
type VARCHAR (50),
value VARCHAR (50)
);